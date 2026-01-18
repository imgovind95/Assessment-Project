import { Worker, Job } from 'bullmq';
import { redisConnection, redisConfig } from '../config/redis';
import { sendEmail } from '../services/emailService';
import { prisma } from '../config/db';
// import { PrismaClient } from '@prisma/client';

const EMAIL_QUEUE_NAME = 'email-queue';

interface EmailJobData {
    id: string; // ScheduledEmail ID
    recipient: string;
    subject: string;
    body: string;
    sender: string; // To track rate limit per sender
    hourlyLimit?: number;
}

const worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, async (job: Job<EmailJobData>) => {
    const { id, recipient, subject, body, sender, hourlyLimit } = job.data;

    // 1. Rate Limiting Check (Per Sender, Per Hour)
    if (hourlyLimit && hourlyLimit > 0) {
        const now = new Date();
        const currentHourTimestamp = Math.floor(now.setMinutes(0, 0, 0) / 1000);
        const key = `rate-limit:${sender}:${currentHourTimestamp}`;

        // Check current usage
        const usage = await redisConnection.get(key);
        const currentCount = usage ? parseInt(usage) : 0;

        if (currentCount >= hourlyLimit) {
            console.log(`[Rate Limit] Scheduler: ${sender} hit limit (${currentCount}/${hourlyLimit}). Delaying job ${job.id}.`);

            // Calculate delay until start of next hour
            const nextHour = new Date();
            nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
            // Add a small buffer (e.g. 10s)
            const delay = nextHour.getTime() - Date.now() + 10000;

            // Move job to delayed
            await job.moveToDelayed(Date.now() + delay, job.token as string);
            return;
        }

        // Increment if safe
        await redisConnection.incr(key);
        await redisConnection.expire(key, 3600 * 2); // Keep for a bit
    }

    // 2. Mock Send (or Real Ethereal Send)
    try {
        // Fetch latest data from DB to ensure we send any edits
        const freshEmail = await prisma.scheduledEmail.findUnique({ where: { id } });
        if (!freshEmail) {
            console.error(`[Worker] Email ${id} not found in DB, skipping.`);
            return;
        }

        console.log(`[Worker] Processing email to ${recipient} (Job ${job.id})`);

        // Use the body from the DB, not the potentially stale job.data
        await sendEmail(recipient, subject, freshEmail.body, sender);

        // 3. Update DB
        await prisma.scheduledEmail.update({
            where: { id },
            data: {
                status: 'SENT',
                sentAt: new Date()
            }
        });

    } catch (error: any) {
        console.error(`[Worker] Failed job ${job.id}:`, error);

        await prisma.scheduledEmail.update({
            where: { id },
            data: {
                status: 'FAILED',
                failedReason: error.message
            }
        });

        throw error;
    }

}, {
    connection: redisConfig,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    limiter: {
        max: 1,
        duration: 1000, // Basic throttle for worker itself?
        // Note: The global queue limiter in queue.ts controls the rate of jobs *entering* the worker if they share the queue settings.
        // But Worker options limiter is for *this worker instance*.
    }
});

export const initWorker = () => {
    console.log("Worker initialized");
    worker.on('completed', job => {
        console.log(`[Worker] Job ${job.id} has completed!`);
    });
    worker.on('failed', (job, err) => {
        console.log(`[Worker] Job ${job?.id} has failed with ${err.message}`);
    });
};
