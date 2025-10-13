require('dotenv').config({ path: './backend/.env' });
const sgMail = require('@sendgrid/mail');

console.log('🔑 SendGrid API Key:', process.env.SENDGRID_API_KEY);
console.log('📧 Email From:', process.env.EMAIL_FROM);

// Configurer SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendDirectEmail() {
    console.log('🚀 Sending DIRECT email to essayedneder0798@gmail.com...');

    const msg = {
        to: 'essayedneder0798@gmail.com',
        from: {
            email: process.env.EMAIL_FROM || 'noreply@smartsupply-health.com',
            name: 'SmartSupply Health'
        },
        subject: 'Test Email DIRECT - SmartSupply Health',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Email DIRECT envoyé !</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">SmartSupply Health</p>
        </div>
        
        <div style="padding: 30px 20px; background: white; border-radius: 0 0 10px 10px;">
          <h2 style="color: #059669; margin-top: 0;">Bonjour !</h2>
          
          <p>Cet email a été envoyé directement via SendGrid API !</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">✅ Configuration SendGrid :</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>API Key: ${process.env.SENDGRID_API_KEY ? 'Configuré ✅' : 'Non configuré ❌'}</li>
              <li>From Email: ${process.env.EMAIL_FROM || 'noreply@smartsupply-health.com'}</li>
              <li>Service: SendGrid Direct</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold;">
              📧 Email réel envoyé !
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Cordialement,<br>
            <strong>L'équipe SmartSupply Health</strong>
          </p>
        </div>
      </div>
    `
    };

    try {
        await sgMail.send(msg);
        console.log('✅ Email envoyé avec succès via SendGrid !');
        console.log('📧 Vérifiez votre boîte de réception : essayedneder0798@gmail.com');
    } catch (error) {
        console.error('❌ Erreur SendGrid:', error);
        if (error.response) {
            console.error('Détails de l\'erreur:', error.response.body);
        }
    }
}

sendDirectEmail();
























