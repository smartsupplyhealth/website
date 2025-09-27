// Environment Configuration
const config = {
  development: {
    API_URL: 'http://localhost:5000',
    ENVIRONMENT: 'development',
    VERSION: '1.0.0'
  },
  staging: {
    API_URL: 'https://ssh-backend-220371.azurewebsites.net',
    ENVIRONMENT: 'staging',
    VERSION: '1.0.0'
  },
  production: {
    API_URL: 'https://ssh-backend-220371.azurewebsites.net',
    ENVIRONMENT: 'production',
    VERSION: '1.0.0'
  }
};

// Get current environment
const getEnvironment = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_ENVIRONMENT) {
    return process.env.REACT_APP_ENVIRONMENT;
  }

  // Check for API URL environment variable
  if (process.env.REACT_APP_API_URL) {
    if (process.env.REACT_APP_API_URL.includes('preprod')) {
      return 'staging';
    }
    if (process.env.REACT_APP_API_URL.includes('prod')) {
      return 'production';
    }
    if (process.env.REACT_APP_API_URL.includes('localhost')) {
      return 'development';
    }
  }

  // Default to development
  return 'development';
};

const currentEnv = getEnvironment();
const environmentConfig = config[currentEnv] || config.development;

// Export configuration
export const API_URL = environmentConfig.API_URL;
export const ENVIRONMENT = environmentConfig.ENVIRONMENT;
export const VERSION = environmentConfig.VERSION;

// Export all config
export default environmentConfig;
