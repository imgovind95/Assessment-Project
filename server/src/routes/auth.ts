import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { prisma } from '../config/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// GET /google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /google/callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    // Successful authentication, redirect dashboard.
    // We might want to issue our own JWT here if we want unified auth, but for now session is used for Google.
    // Or we can generate a token here too and pass it via query param?
    // Let's stick to session for Google for now or standard redirect.
    res.redirect(`${CLIENT_URL}/dashboard`);
});

// GET /me
router.get('/me', async (req, res) => {
    // Check Passport Session
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.json({ user: req.user });
    }

    // Check Bearer Token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (user) {
                return res.json({ user });
            }
        } catch (err) {
            // Invalid token
        }
    }

    res.status(401).json({ user: null });
});

// GET /logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.redirect(`${CLIENT_URL}/login`);
    });
});

// POST /register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
            }
        });

        // Generate Token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
