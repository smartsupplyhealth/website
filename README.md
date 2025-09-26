# SmartSupply Health Management System

A comprehensive health supply management system with automated ordering, inventory tracking, and secure payment processing.

## 🚀 Features

### For Clients
- **Dashboard**: Real-time statistics and order tracking
- **Inventory Management**: Track medical supplies and set reorder points
- **Auto-Ordering**: Automated reordering when stock reaches threshold
- **Manual Orders**: Place orders through product catalog
- **Payment Management**: Secure payment processing with saved cards
- **Order History**: Complete order tracking and status updates

### For Suppliers
- **Product Management**: Add, edit, and manage product catalog
- **Order Management**: Process and track client orders
- **Client Management**: View client information and order history
- **Analytics**: Detailed sales and performance statistics
- **Inventory Control**: Real-time stock management

### Security Features
- **Auto-Order Limits**: Maximum 2 auto orders per day for security
- **Manual Verification**: Required manual order between auto orders
- **Email Notifications**: Security alerts and order confirmations
- **CVV Verification**: Required for all saved card payments

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Stripe** for payment processing
- **JWT** for authentication
- **Node-cron** for scheduled tasks
- **SendGrid** for email notifications

### Frontend
- **React.js** with functional components
- **React Router** for navigation
- **Context API** for state management
- **Axios** for API communication
- **CSS3** with modern styling

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Stripe account
- SendGrid account

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/smartsupply

# JWT
JWT_SECRET=your_jwt_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_email@domain.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 🚀 Getting Started

1. **Clone the repository**
2. **Install dependencies** for both frontend and backend
3. **Set up environment variables**
4. **Start MongoDB**
5. **Run the backend server**
6. **Run the frontend development server**
7. **Access the application** at http://localhost:3000

## 📱 Usage

### Client Dashboard
- View order statistics and inventory status
- Set up auto-ordering with reorder points
- Place manual orders through the catalog
- Manage payment methods and view order history

### Supplier Dashboard
- Manage product catalog and inventory
- Process client orders and track deliveries
- View analytics and performance metrics
- Manage client relationships

## 🔒 Security

- **Authentication**: JWT-based user authentication
- **Authorization**: Role-based access control
- **Payment Security**: Stripe integration with CVV verification
- **Auto-Order Limits**: Security measures to prevent abuse
- **Email Verification**: Automated security notifications

## 📧 Email Notifications

The system sends automated emails for:
- Order confirmations
- Payment receipts
- Auto-order rejections
- Security alerts
- Inventory warnings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team.

---

**SmartSupply Health** - Streamlining healthcare supply management with intelligent automation.


