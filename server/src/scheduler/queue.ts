import { Queue } from 'bullmq';
import { redisConnection, redisConfig } from '../config/redis';

// Requirements: "Min delay between individual email sends".
// We can enforce a global limiter on the queue.
// e.g. 1 email per 2 seconds.
const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
    },
});
