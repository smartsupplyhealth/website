const mongoose = require('mongoose');
const sendEmail = require('../utils/emailService');

require('dotenv').config({ path: './.env' });

async function testEmail() {
    console.log('Testing email service...');

    try {
        // Test email to the user
        const testEmail = 'essayedneder0798@gmail.com';
        const subject = 'Test Email - SmartSupply Health';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Test Email - SmartSupply Health</h2>
        <p>Bonjour,</p>
        <p>Ceci est un email de test pour vérifier que le service d'email fonctionne correctement.</p>
        <p>Si vous recevez cet email, cela signifie que SendGrid est configuré et fonctionnel.</p>
        <br>
        <p>Cordialement,<br>L'équipe SmartSupply Health</p>
      </div>
    `;

        console.log(`Sending test email to: ${testEmail}`);
        await sendEmail(testEmail, subject, html);
        console.log('✅ Test email sent successfully!');

    } catch (error) {
        console.error('❌ Error sending test email:', error);
    } finally {
        process.exit(0);
    }
}

testEmail();


