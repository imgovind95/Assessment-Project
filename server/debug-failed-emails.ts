import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFailedEmails() {
    try {
        const failedEmails = await prisma.scheduledEmail.findMany({
            where: { status: 'FAILED' },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: { recipient: true, failedReason: true, updatedAt: true }
        });

        console.log('--- FAILED EMAILS ---');
        console.log(JSON.stringify(failedEmails, null, 2));
    } catch (error) {
        console.error('Error fetching emails:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkFailedEmails();
