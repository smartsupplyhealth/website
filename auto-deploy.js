const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting SmartSupply Health Auto-Deploy...');

// Watch for changes in frontend and backend directories
const watcher = chokidar.watch([
  'frontend/src/**/*',
  'backend/**/*',
  '*.md',
  '*.json',
  '*.yml',
  '*.yaml',
  'Dockerfile',
  'docker-compose.yml'
], {
  ignored: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/.git/**',
    '**/uploads/**',
    '**/*.log',
    '**/.env',
    '**/coverage/**'
  ],
  persistent: true,
  ignoreInitial: true
});

let isCommitting = false;
let commitTimeout;

// Function to execute git commands
function executeGitCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📝 ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.log(`ℹ️  ${stderr}`);
      }
      console.log(`✅ ${description} completed`);
      resolve(stdout);
    });
  });
}

// Function to commit and push changes
async function commitAndPush() {
  if (isCommitting) {
    console.log('⏳ Already committing, skipping...');
    return;
  }

  isCommitting = true;
  
  try {
    // Check if there are changes
    const status = await executeGitCommand('git status --porcelain', 'Checking for changes');
    
    if (!status.trim()) {
      console.log('📭 No changes to commit');
      isCommitting = false;
      return;
    }

    // Add all changes
    await executeGitCommand('git add .', 'Adding changes');
    
    // Create commit message with timestamp
    const timestamp = new Date().toLocaleString('fr-FR');
    const commitMessage = `Auto-deploy: ${timestamp}`;
    
    // Commit changes
    await executeGitCommand(`git commit -m "${commitMessage}"`, 'Committing changes');
    
    // Push to GitHub
    await executeGitCommand('git push', 'Pushing to GitHub');
    
    console.log('🎉 Auto-deploy completed successfully!');
    console.log('🔗 Check your pipeline at: https://github.com/smartsupplyhealth/website/actions');
    
  } catch (error) {
    console.error('❌ Auto-deploy failed:', error.message);
  } finally {
    isCommitting = false;
  }
}

// Watch for file changes
watcher
  .on('add', (filePath) => {
    console.log(`📄 File added: ${filePath}`);
    scheduleCommit();
  })
  .on('change', (filePath) => {
    console.log(`📝 File changed: ${filePath}`);
    scheduleCommit();
  })
  .on('unlink', (filePath) => {
    console.log(`🗑️  File deleted: ${filePath}`);
    scheduleCommit();
  })
  .on('error', (error) => {
    console.error('❌ Watcher error:', error);
  });

// Schedule commit with debouncing (wait 5 seconds after last change)
function scheduleCommit() {
  clearTimeout(commitTimeout);
  commitTimeout = setTimeout(() => {
    commitAndPush();
  }, 5000); // Wait 5 seconds after last change
}

console.log('👀 Watching for changes...');
console.log('💡 Make changes to your files and they will be automatically deployed!');
console.log('🛑 Press Ctrl+C to stop the auto-deploy');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping auto-deploy...');
  watcher.close();
  process.exit(0);
});
