# 🚀 TrampoHero Backend API

Backend API server for TrampoHero marketplace platform.

## 📋 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Job Management** - CRUD operations for job postings and applications
- **Wallet System** - Balance management, withdrawals, transactions
- **Weekly Challenges** - Gamification with rewards
- **Talent Rankings** - Leaderboard system
- **TrampoStore** - E-commerce API for products and orders
- **TrampoAds** - Advertising platform API
- **Security** - Helmet, rate limiting, input validation

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (ready for integration)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Validation**: express-validator

## 📦 Installation

```bash
cd backend
npm install
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update environment variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/trampohero
JWT_SECRET=your_secure_secret_key
JWT_EXPIRE=30d
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=your_stripe_key
FRONTEND_URL=http://localhost:3000
```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server will run on `http://localhost:5000`

## 📚 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "freelancer",
  "niche": "RESTAURANT"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "freelancer"
  }
}
```

### Jobs

#### Get All Jobs
```http
GET /api/jobs?niche=RESTAURANT&status=open
```

#### Create Job (Employer Only)
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Garçom de Gala",
  "payment": 180,
  "niche": "RESTAURANT",
  "location": "São Paulo, SP",
  "description": "Evento de gala",
  "date": "2024-03-15",
  "startTime": "18:00"
}
```

#### Apply to Job (Freelancer Only)
```http
POST /api/jobs/:id/apply
Authorization: Bearer <token>
```

### Wallet

#### Get Balance
```http
GET /api/wallet/balance
Authorization: Bearer <token>
```

#### Request Withdrawal
```http
POST /api/wallet/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500
}
```

### Challenges

#### Get Active Challenges
```http
GET /api/challenges
Authorization: Bearer <token>
```

#### Claim Reward
```http
POST /api/challenges/:id/claim
Authorization: Bearer <token>
```

### Rankings

#### Get Talent Rankings
```http
GET /api/ranking?niche=RESTAURANT
```

### Store

#### Get Products
```http
GET /api/store/products?category=uniform
```

#### Create Order
```http
POST /api/store/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "products": [
    {"productId": "p1", "quantity": 1}
  ],
  "shippingAddress": {
    "street": "Av. Paulista, 1000",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  }
}
```

### Ads (Employer Only)

#### Get Campaigns
```http
GET /api/ads
Authorization: Bearer <token>
```

#### Create Campaign
```http
POST /api/ads
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "banner",
  "content": {
    "title": "Anúncio",
    "description": "Descrição",
    "imageUrl": "https://...",
    "ctaText": "Clique aqui",
    "ctaUrl": "https://..."
  },
  "targeting": {
    "niches": ["RESTAURANT"],
    "userActivity": "high"
  },
  "budget": 2000
}
```

#### Get Analytics
```http
GET /api/ads/:id/analytics
Authorization: Bearer <token>
```

## 🔒 Security Features

- **Helmet**: Security headers
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs with salt rounds
- **Input Validation**: express-validator
- **CORS**: Configured for frontend origin

## 🗄️ Database Integration

The API is ready for MongoDB integration. To connect:

1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in `.env`
3. Create database models in `src/models/`
4. Replace mock data with actual database queries

Example model structure:
```javascript
// src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['freelancer', 'employer'], required: true },
  // ... other fields
});

export default mongoose.model('User', userSchema);
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/           # API route handlers
│   │   ├── auth.js       # Authentication routes
│   │   ├── jobs.js       # Job management routes
│   │   ├── users.js      # User profile routes
│   │   ├── wallet.js     # Wallet operations
│   │   ├── challenges.js # Weekly challenges
│   │   ├── ranking.js    # Talent rankings
│   │   ├── store.js      # E-commerce routes
│   │   └── ads.js        # Advertising routes
│   ├── middleware/       # Custom middleware
│   │   └── auth.js       # Authentication middleware
│   ├── models/           # Database models (to be added)
│   ├── controllers/      # Business logic (to be added)
│   ├── config/           # Configuration files
│   └── server.js         # Main server file
├── .env.example          # Environment variables template
├── package.json          # Dependencies
└── README.md            # This file
```

## 🚧 TODO / Next Steps

- [ ] Integrate MongoDB database
- [ ] Create Mongoose models for all entities
- [ ] Implement payment gateway (Stripe/MercadoPago)
- [ ] Add WebSocket support for real-time chat
- [ ] Implement file upload (AWS S3/Cloudinary)
- [ ] Add email service (SendGrid/Mailgun)
- [ ] Implement push notifications
- [ ] Add comprehensive error handling
- [ ] Write unit and integration tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement logging (Winston/Morgan)
- [ ] Add monitoring (Sentry/New Relic)

## 🧪 Testing

```bash
# Install test dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

## 📝 License

Proprietary © 2026 TrampoHero Inc.

## 👥 Team

Developed by TrampoHero Team

## 🆘 Support

For issues or questions, contact: suporte@trampohero.com.br
