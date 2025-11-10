// servease-backend/utils/emailSender.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Prevents SSL verification issues
    },
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: `"Servease Notifications" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        });

        console.log(`✅ Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Email Sending Failed:', error.message);
        console.error(error);
        return false; // Prevent crash
    }
};

module.exports = sendEmail;
