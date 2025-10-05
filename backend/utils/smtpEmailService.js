require('dotenv').config();
const nodemailer = require('nodemailer');

// --- CONFIGURATION SMTP ---
let transporter = null;

// Initialiser le transporteur SMTP
function initializeSMTP() {
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD.replace(/\s/g, '') // Supprimer les espaces
            }
        });
        console.log("--- Service d'email SMTP configuré avec Gmail ---");
        console.log(`Email d'expédition: ${process.env.SMTP_EMAIL}`);
        return true;
    } else {
        console.warn("⚠️  SMTP not configured: SMTP_EMAIL or SMTP_PASSWORD not provided");
        return false;
    }
}

// Initialiser au démarrage
const isSMTPConfigured = initializeSMTP();

/**
 * Envoie un email en utilisant SMTP (Gmail).
 * @param {string} to - L'adresse email du destinataire.
 * @param {string} subject - Le sujet de l'email.
 * @param {string} html - Le contenu HTML de l'email.
 */
const sendEmail = async (to, subject, html) => {
    // Vérifier si SMTP est configuré
    if (!isSMTPConfigured || !transporter) {
        console.warn("⚠️  SMTP not configured, using console simulation for email:");
        console.log("=".repeat(60));
        console.log(`📧 EMAIL SIMULATION`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`From: SmartSupply Health <${process.env.SMTP_EMAIL || 'noreply@smartsupply-health.com'}>`);
        console.log("Content:");
        console.log(html.replace(/<[^>]*>/g, '')); // Remove HTML tags for console display
        console.log("=".repeat(60));
        console.log("✅ Email simulation completed (configure SMTP_EMAIL and SMTP_PASSWORD for real emails)");
        return;
    }

    const mailOptions = {
        from: {
            name: 'SmartSupply Health',
            address: process.env.SMTP_EMAIL
        },
        to: to,
        subject: subject,
        html: html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email envoyé avec succès à ${to} avec le sujet "${subject}"`);
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email via SMTP:", error);

        // En cas d'erreur, utiliser la simulation
        console.log("🔄 Fallback vers simulation d'email...");
        console.log("=".repeat(60));
        console.log(`📧 EMAIL SIMULATION (Fallback)`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`From: SmartSupply Health <${process.env.SMTP_EMAIL}>`);
        console.log("Content:");
        console.log(html.replace(/<[^>]*>/g, ''));
        console.log("=".repeat(60));
        console.log("✅ Email simulation completed (SMTP error occurred)");
    }
};

module.exports = sendEmail;
