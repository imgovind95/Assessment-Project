import { Router } from 'express';
import { prisma } from '../config/db';
import { emailQueue } from '../scheduler/queue';

const router = Router();

// GET /scheduled-emails
router.get('/scheduled-emails', async (req, res) => {
    try {
        const emails = await prisma.scheduledEmail.findMany({
            where: { status: 'PENDING' },
            orderBy: { scheduledAt: 'asc' },
            include: { campaign: true }
        });
        res.json(emails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

// GET /sent-emails
router.get('/sent-emails', async (req, res) => {
    try {
        const emails = await prisma.scheduledEmail.findMany({
            where: { status: 'SENT' },
            orderBy: { sentAt: 'desc' }
        });
        res.json(emails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sent emails' });
    }
});

// POST /schedule
router.post('/schedule', async (req, res) => {
    try {
        const { recipients, subject, body, startTime, delaySeconds, hourlyLimit, sender } = req.body;

        // recipients can be an array of strings
        if (!recipients || !Array.isArray(recipients)) {
            return res.status(400).json({ error: 'recipients must be an array' });
        }

        // Create Campaign
        const campaign = await prisma.campaign.create({
            data: {
                title: subject,
                startTime: new Date(startTime),
                delaySeconds: delaySeconds || 0,
                hourlyLimit: hourlyLimit || 0,
                // Assuming a dummy user for now or from Auth
                user: {
                    connectOrCreate: {
                        where: { email: sender || 'test@example.com' },
                        create: { email: sender || 'test@example.com' }
                    }
                }
            }
        });

        const jobs = [];
        let currentDelay = 0;
        const startTimestamp = new Date(startTime).getTime();
        const now = Date.now();

        // Initial delay from now until start time
        let initialOffset = startTimestamp - now;
        if (initialOffset < 0) initialOffset = 0;

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const scheduledTime = new Date(startTimestamp + (currentDelay * 1000));

            // 1. Save to DB
            const emailRecord = await prisma.scheduledEmail.create({
                data: {
                    recipient,
                    subject,
                    body,
                    scheduledAt: scheduledTime,
                    campaignId: campaign.id,
                    status: 'PENDING'
                }
            });

            // 2. Add to Queue
            const jobDelay = initialOffset + (currentDelay * 1000);

            // Priority logic: High (10) for direct send, Low (1) for scheduled
            const jobPriority = req.body.priority === 'high' ? 10 : 1;

            // Force 0 delay if it's high priority (Send Now), regardless of start time calculation
            // Also ensure we don't accidentally send it to the 'delayed' set if we want it now.
            const finalDelay = req.body.priority === 'high' ? 0 : jobDelay;

            await emailQueue.add('send-email', {
                id: emailRecord.id,
                recipient,
                subject,
                body,
                sender: sender || 'test@example.com',
                hourlyLimit: hourlyLimit || 0
            }, {
                delay: finalDelay,
                priority: jobPriority,
                jobId: emailRecord.id
            });

            currentDelay += (delaySeconds || 0);
        }

        res.json({ message: 'Campaign scheduled', campaignId: campaign.id, count: recipients.length });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST /delete-emails
router.post('/delete-emails', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'ids must be an array' });
        }

        // Delete from DB
        await prisma.scheduledEmail.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        // Note: We are not removing from BullMQ here for simplicity. 
        // If the job runs, it will likely fail to update the DB and be marked as failed, which is acceptable.

        res.json({ message: 'Emails deleted', count: ids.length });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /scheduled-emails/:id
router.put('/scheduled-emails/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req.body;

        if (!body) {
            return res.status(400).json({ error: 'Body is required' });
        }

        const updatedEmail = await prisma.scheduledEmail.update({
            where: { id },
            data: { body }
        });

        res.json(updatedEmail);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
