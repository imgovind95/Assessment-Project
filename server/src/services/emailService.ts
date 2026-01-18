import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
    if (transporter) return transporter;

    // Check if env vars are provided
    if (process.env.ETHEREAL_EMAIL && process.env.ETHEREAL_PASS) {
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.ETHEREAL_EMAIL,
                pass: process.env.ETHEREAL_PASS
            }
        });
    } else {
        // Generate test account
        console.log("Generating Ethereal Test Account...");
        const testAccount = await nodemailer.createTestAccount();
        console.log(`Ethereal Account: ${testAccount.user} / ${testAccount.pass}`);

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }
    return transporter;
};

export const sendEmail = async (to: string, subject: string, html: string, from: string = '"ReachInbox" <sender@example.com>') => {
    const transport = await getTransporter();

    const info = await transport.sendMail({
        from,
        to,
        subject,
        html,
    });

    console.log(`[Email Sent] To: ${to} | ID: ${info.messageId} | URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
};
