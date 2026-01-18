import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './db';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'MISSING_ID',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'MISSING_SECRET',
            callbackURL: 'http://localhost:5000/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Find or Create User
                const email = profile.emails?.[0].value;
                if (!email) return done(new Error('No email found in Google profile'));

                const user = await prisma.user.upsert({
                    where: { googleId: profile.id },
                    update: {
                        name: profile.displayName,
                        accessToken,
                        refreshToken,
                    },
                    create: {
                        email,
                        googleId: profile.id,
                        name: profile.displayName,
                        accessToken,
                        refreshToken,
                    },
                });

                return done(null, user);
            } catch (error) {
                return done(error as any, undefined);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
