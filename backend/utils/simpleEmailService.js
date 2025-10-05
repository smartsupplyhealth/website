require('dotenv').config();

/**
 * Service d'email simple avec simulation améliorée
 * En attendant la configuration SMTP complète
 */
const sendEmail = async (to, subject, html) => {
    console.log("📧 EMAIL SERVICE - SmartSupply Health");
    console.log("=".repeat(60));
    console.log(`📬 To: ${to}`);
    console.log(`📋 Subject: ${subject}`);
    console.log(`👤 From: SmartSupply Health <essayedneder0798@gmail.com>`);
    console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
    console.log("=".repeat(60));
    console.log("📄 Email Content:");
    console.log(html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
    console.log("=".repeat(60));
    console.log("✅ Email 'sent' successfully!");
    console.log("📧 In production, this would be sent via SMTP/SendGrid");
    console.log("=".repeat(60));

    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
};

module.exports = sendEmail;



