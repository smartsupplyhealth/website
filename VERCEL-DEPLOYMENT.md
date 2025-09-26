# 🚀 SmartSupply Health - Vercel Deployment Guide

This guide will help you deploy your SmartSupply-Health project to Vercel.

## 📋 **Prerequisites**

### **1. Vercel Account**
- [Create Vercel Account](https://vercel.com)
- [Connect GitHub Account](https://vercel.com/import)

### **2. MongoDB Atlas Account**
- [Create MongoDB Atlas Account](https://www.mongodb.com/atlas)
- [Get Connection String](https://docs.atlas.mongodb.com/getting-started/)

## 🛠️ **Step 1: Deploy Frontend**

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure:**
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

## 🛠️ **Step 2: Deploy Backend**

1. **Create another Vercel project**
2. **Import the same GitHub repository**
3. **Configure:**
   - **Root Directory**: `backend`
   - **Framework**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

## 🔧 **Step 3: Configure Environment Variables**

### **Frontend Environment Variables:**
```
REACT_APP_API_URL=https://your-backend.vercel.app
```

### **Backend Environment Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-jwt-secret
SENDGRID_API_KEY=your-sendgrid-key
STRIPE_SECRET_KEY=your-stripe-secret
GOOGLE_AI_API_KEY=your-google-ai-key
```

## 🚀 **Step 4: Set Up GitHub Secrets (Optional)**

For automatic deployment, add these secrets to your GitHub repository:

1. **Go to GitHub Repository Settings**
2. **Navigate to Secrets and Variables > Actions**
3. **Add the following secrets:**

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-frontend-project-id
VERCEL_BACKEND_PROJECT_ID=your-backend-project-id
```

## 🌐 **Step 5: Access Your Application**

### **Your App URLs:**
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.vercel.app`
- **API Documentation**: `https://your-backend.vercel.app/api`

## 📊 **Step 6: Monitor Your Application**

### **Vercel Dashboard:**
1. **Go to your Vercel Dashboard**
2. **Check "Functions" for backend logs**
3. **Check "Analytics" for performance data**
4. **Check "Deployments" for deployment history**

## 🔄 **Step 7: CI/CD Pipeline**

### **What Happens Automatically:**
1. **Code Push** → Triggers GitHub Actions
2. **Tests** → Runs backend and frontend tests
3. **Security Scan** → Checks for vulnerabilities
4. **Deploy** → Deploys to Vercel automatically
5. **Notify** → Sends deployment status

### **Pipeline Status:**
- **Check**: https://github.com/your-username/SmartSupply-Health/actions
- **Green checkmark** ✅ = Success
- **Red X** ❌ = Failed (check logs)

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **Build Failures**
   - Check if all dependencies are installed
   - Verify environment variables are set
   - Check Vercel function logs

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check if IP addresses are whitelisted
   - Ensure database user has proper permissions

3. **Environment Variables Not Set**
   - Check Vercel project settings
   - Verify all required variables are added
   - Restart the deployment

### **Useful Commands:**
```bash
# Check Vercel CLI
vercel --version

# Deploy manually
vercel --prod

# Check logs
vercel logs
```

## 💰 **Cost Optimization**

### **Free Tier Limits:**
- **Vercel**: 100GB bandwidth, 1000 serverless function invocations
- **MongoDB Atlas**: 512MB storage, shared clusters
- **GitHub Actions**: 2000 minutes/month

### **Scaling:**
- **Vercel Pro**: $20/month for more bandwidth and functions
- **MongoDB Atlas**: Pay-as-you-go for more storage
- **Custom Domain**: Free with Vercel

## 🔒 **Security Best Practices**

1. **Use Environment Variables** for sensitive data
2. **Enable HTTPS** (automatic with Vercel)
3. **Configure CORS** properly
4. **Use MongoDB Atlas IP whitelisting**
5. **Regular security updates**

## 📈 **Performance Optimization**

1. **Enable Vercel Analytics** for monitoring
2. **Use Vercel Edge Functions** for better performance
3. **Optimize images** with Vercel Image Optimization
4. **Use CDN** for static assets (automatic with Vercel)

## 🎯 **Next Steps**

1. **Set up custom domain** (optional)
2. **Configure monitoring alerts**
3. **Set up staging environment**
4. **Implement error tracking**
5. **Set up backup strategy**

---

**🎉 Congratulations! Your SmartSupply-Health app is now running on Vercel!**

**Your app is live at**: 
- Frontend: `https://your-frontend.vercel.app`
- Backend: `https://your-backend.vercel.app`
