const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// Webhook endpoint for triggering deployments
router.post('/deploy', async (req, res) => {
  try {
    console.log('🚀 Deployment webhook triggered');
    
    // Execute git pull and restart
    exec('git pull && npm run build', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Deployment error:', error);
        return res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
      
      console.log('✅ Deployment successful');
      console.log(stdout);
      
      res.json({ 
        success: true, 
        message: 'Deployment completed successfully',
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check for webhook
router.get('/webhook/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
