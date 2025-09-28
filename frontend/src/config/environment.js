// Environment Configuration
const config = {
  development: {
    API_URL: 'http://localhost:5000',
    ENVIRONMENT: 'development',
    VERSION: '1.0.0',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_51S2sUD0FbokXntu8KiGeYOvvKJjB8gm4OaNcO16L0xKkmUMqAnQ6ibxyxlHOAb0sT6JlxRRGWhXe9gF1cpxIe8n500TJFE7IWv'
  },
  staging: {
    API_URL: 'https://ssh-backend-220371.azurewebsites.net',
    ENVIRONMENT: 'staging',
    VERSION: '1.0.0',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_51S2sUD0FbokXntu8KiGeYOvvKJjB8gm4OaNcO16L0xKkmUMqAnQ6ibxyxlHOAb0sT6JlxRRGWhXe9gF1cpxIe8n500TJFE7IWv'
  },
  production: {
    API_URL: 'https://ssh-backend-220371.azurewebsites.net',
    ENVIRONMENT: 'production',
    VERSION: '1.0.0',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_51S2sUD0FbokXntu8KiGeYOvvKJjB8gm4OaNcO16L0xKkmUMqAnQ6ibxyxlHOAb0sT6JlxRRGWhXe9gF1cpxIe8n500TJFE7IWv'
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
export const STRIPE_PUBLISHABLE_KEY = environmentConfig.STRIPE_PUBLISHABLE_KEY;

// Export all config
export default environmentConfig;
