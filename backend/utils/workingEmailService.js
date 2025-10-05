require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuration pour un service email qui fonctionne vraiment
let transporter = null;

function initializeWorkingEmail() {
    // Utiliser un service de test ou un service SMTP simple
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true pour 465, false pour autres ports
        auth: {
            user: process.env.SMTP_EMAIL || 'essayedneder0798@gmail.com',
            pass: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s/g, '') : null
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    console.log("--- Service d'email WORKING configuré ---");
    console.log(`Email: ${process.env.SMTP_EMAIL || 'essayedneder0798@gmail.com'}`);
    return true;
}

// Initialiser le service
const isEmailConfigured = initializeWorkingEmail();

const sendEmail = async (to, subject, html) => {
    if (!isEmailConfigured || !transporter) {
        console.warn("⚠️  Email service not configured, using console simulation:");
        console.log("=".repeat(60));
        console.log(`📧 EMAIL SIMULATION`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`From: SmartSupply Health <essayedneder0798@gmail.com>`);
        console.log("Content:");
        console.log(html.replace(/<[^>]*>/g, ''));
        console.log("=".repeat(60));
        console.log("✅ Email simulation completed");
        return;
    }

    const mailOptions = {
        from: {
            name: 'SmartSupply Health',
            address: process.env.SMTP_EMAIL || 'essayedneder0798@gmail.com'
        },
        to: to,
        subject: subject,
        html: html,
    };

    try {
        console.log(`📧 Sending REAL email to ${to}...`);
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully! Message ID: ${result.messageId}`);
        console.log(`📬 Check your inbox: ${to}`);
        return result;
    } catch (error) {
        console.error("❌ Error sending email:", error.message);

        // Fallback vers simulation
        console.log("🔄 Falling back to console simulation...");
        console.log("=".repeat(60));
        console.log(`📧 EMAIL SIMULATION (Fallback)`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`From: SmartSupply Health <essayedneder0798@gmail.com>`);
        console.log("Content:");
        console.log(html.replace(/<[^>]*>/g, ''));
        console.log("=".repeat(60));
        console.log("✅ Email simulation completed (Real email failed)");
    }
};

module.exports = sendEmail;



