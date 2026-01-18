import nodemailer from 'nodemailer';

async function generate() {
    try {
        const account = await nodemailer.createTestAccount();
        console.log('\n--- SUCCESS! COPY THESE INTO YOUR server/.env FILE ---');
        console.log(`ETHEREAL_EMAIL="${account.user}"`);
        console.log(`ETHEREAL_PASS="${account.pass}"`);
        console.log('------------------------------------------------------\n');
    } catch (err) {
        console.error('Failed to generate account:', err);
    }
}

generate();
