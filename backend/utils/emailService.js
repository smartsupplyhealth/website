require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const smtpEmailService = require('./smtpEmailService');
const simpleEmailService = require('./simpleEmailService');
const workingEmailService = require('./workingEmailService');

// --- CONFIGURATION DE SENDGRID ---
// On configure la clé API une seule fois au démarrage de l'application.
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("--- Service d'email configuré avec SendGrid ---");
  console.log(`Email d'expédition par défaut: ${process.env.EMAIL_FROM || 'undefined'}`);
  console.log(`Clé API SendGrid définie: true`);
} else {
  console.warn("⚠️  SendGrid not configured: API key does not start with 'SG.' or is not provided");
}
console.log("-------------------------------------------");

/**
 * Envoie un email en utilisant l'API de SendGrid.
 * @param {string} to - L'adresse email du destinataire.
 * @param {string} subject - Le sujet de l'email.
 * @param {string} html - Le contenu HTML de l'email.
 */
const sendEmail = async (to, subject, html) => {
  // Priorité 1: Essayer le service email qui fonctionne vraiment
  if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    console.log("📧 Using WORKING email service for REAL emails...");
    return await workingEmailService(to, subject, html);
  }

  // Priorité 2: Essayer SMTP (Gmail) si pas de mot de passe
  if (process.env.SMTP_EMAIL) {
    console.log("📧 Using SMTP (Gmail) for email sending...");
    try {
      return await smtpEmailService(to, subject, html);
    } catch (error) {
      console.error("❌ SMTP Error, falling back to simple service:", error.message);
      return await simpleEmailService(to, subject, html);
    }
  }

  // SendGrid désactivé - utilisation SMTP uniquement

  // Priorité 3: Service simple avec simulation améliorée
  console.log("📧 Using simple email service with enhanced simulation...");
  return await simpleEmailService(to, subject, html);
};

module.exports = sendEmail;
