# SmartSupply Health - Deployment Guide

## 🚀 Automated CI/CD Pipeline

This project includes GitHub Actions workflows for automated testing, building, and deployment.

### Pipeline Features

- **Automated Testing**: Runs on every push and pull request
- **Security Scanning**: Audits dependencies for vulnerabilities
- **Multi-Environment Support**: Separate workflows for development and production
- **Docker Support**: Containerized deployment ready
- **Artifact Management**: Build artifacts are stored for deployment

### Workflows

1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
   - Triggers on pushes to `main` and `develop` branches
   - Runs backend and frontend tests
   - Performs security audits
   - Builds and deploys on `main` branch

2. **Development Build** (`.github/workflows/dev-build.yml`)
   - Triggers on feature branches and develop
   - Quick build verification
   - Artifact upload for testing

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/smartsupplyhealth/website.git
   cd website
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

### Using Docker directly

1. **Build the image**
   ```bash
   docker build -t smartsupply-health .
   ```

2. **Run the container**
   ```bash
   docker run -p 5000:5000 \
     -e MONGODB_URI=mongodb://host.docker.internal:27017/smartsupply \
     -e JWT_SECRET=your-secret \
     smartsupply-health
   ```

## 🌐 Manual Deployment

### Prerequisites

- Node.js 18+
- MongoDB
- Git

### Backend Deployment

1. **Install dependencies**
   ```bash
   cd backend
   npm install --production
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Frontend Deployment

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Serve the build**
   ```bash
   # Using serve (install globally: npm install -g serve)
   serve -s build -l 3000
   
   # Or using nginx/apache to serve the build folder
   ```

## 🔧 Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/smartsupply

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@smartsupply.com

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# Google AI
GOOGLE_AI_API_KEY=your-google-ai-key

# CORS
CORS_ORIGIN=https://yourdomain.com
```

## 📊 Monitoring and Health Checks

- **Health Endpoint**: `GET /health`
- **Response**: JSON with status, timestamp, uptime, and environment

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, unique secrets
3. **Database**: Use authentication and SSL in production
4. **CORS**: Configure appropriate origins
5. **File Uploads**: Validate file types and sizes

## 🚀 Deployment Platforms

### Vercel (Frontend)
1. Connect your GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/build`

### Railway (Full Stack)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Heroku (Full Stack)
1. Create a Heroku app
2. Add MongoDB addon
3. Set environment variables
4. Deploy via GitHub integration

## 📝 GitHub Actions Secrets

To enable automated deployment, add these secrets to your GitHub repository:

- `VERCEL_TOKEN`: For Vercel deployment
- `RAILWAY_TOKEN`: For Railway deployment
- `HEROKU_API_KEY`: For Heroku deployment

## 🔄 Updating the Pipeline

The pipeline will automatically:
- Run tests on every push
- Build artifacts on successful tests
- Deploy to production on `main` branch pushes
- Send notifications on success/failure

## 📞 Support

For deployment issues:
1. Check the GitHub Actions logs
2. Verify environment variables
3. Ensure all services are running
4. Check the health endpoint: `/health`
