import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import RedisStore from 'connect-redis';
// import { PrismaClient } from '@prisma/client';
import apiRoutes from './routes/index';
import authRoutes from './routes/auth';
import passport from './config/passport';
import { initWorker } from './scheduler/worker';
import { redisConnection } from './config/redis';

// dotenv.config(); // Loaded at top

const app = express();
// const prisma = new PrismaClient(); // Moved to config/db.ts used in routes
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Session with Redis Store
app.use(session({
    store: new RedisStore({ client: redisConnection }),
    secret: process.env.COOKIE_KEY || 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initWorker();
});

// Prisma is now in config/db.ts
