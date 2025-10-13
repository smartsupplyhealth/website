const sendEmail = require('./utils/workingEmailService');

async function testEmail() {
    try {
        console.log('🧪 Testing email sending...');

        const result = await sendEmail(
            'essayedneder0798@gmail.com',
            'Test Email from SmartSupply Health',
            `
        <h1>Test Email</h1>
        <p>This is a test email from SmartSupply Health.</p>
        <p>If you receive this, the email system is working!</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
        );

        console.log('✅ Email test completed:', result);
    } catch (error) {
        console.error('❌ Email test failed:', error);
    }
}

testEmail();

















