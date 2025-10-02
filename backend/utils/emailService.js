require('dotenv').config();
const sgMail = require('@sendgrid/mail');

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
  // On vérifie si la clé API et l'expéditeur sont bien configurés.
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_API_KEY.startsWith('SG.') || !process.env.EMAIL_FROM) {
    console.warn("⚠️  Email not sent: SendGrid not properly configured (API key missing or invalid, or EMAIL_FROM not set)");
    // On ne lance pas d'erreur pour ne pas crasher le serveur, mais on log le problème.
    return;
  }

  const msg = {
    to: to,
    from: {
      email: process.env.EMAIL_FROM,
      name: 'SmartSupply Health' // Vous pouvez personnaliser le nom de l'expéditeur ici
    },
    subject: subject,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email envoyé avec succès à ${to} avec le sujet "${subject}"`);
  } catch (error) {
    console.error("Erreur détaillée lors de l'envoi de l'email via SendGrid:", error);

    // SendGrid envoie souvent des détails utiles dans la réponse de l'erreur.
    if (error.response) {
      console.error("Détails de l'erreur SendGrid:", error.response.body);
    }
  }
};

module.exports = sendEmail;
