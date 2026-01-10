# MISARH - Luxury Fragrance E-Commerce Platform

A luxury fragrance e-commerce platform featuring AI-powered custom scent consultations, built as a monorepo with Angular frontend and Node.js backend.

## 🌟 Features

- **E-Commerce**: Full-featured online store for luxury fragrances
- **AI Consultations**: OpenAI GPT-4 powered personalized scent recommendations
- **Custom Formulas**: Bespoke fragrance creation and recording
- **Subscriptions**: Monthly/quarterly fragrance delivery service
- **Admin Dashboard**: Comprehensive management interface
- **Customer Dashboard**: Order history, consultations, scent preferences
- **Payment Integration**: Paystack and Flutterwave support
- **Email Automation**: Order confirmations, consultation bookings, newsletters

## 🛠️ Technology Stack

### Frontend

- **Angular 17+** with TypeScript
- **SCSS** for styling
- **RxJS** for reactive programming
- **Chart.js/D3.js** for data visualization

### Backend

- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database
- **Redis** for caching and sessions
- **OpenAI API** for scent analysis

### DevOps

- **Docker** & **Docker Compose**
- **Nginx** reverse proxy
- **GitHub Actions** for CI/CD

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** & **Docker Compose**
- **WSL2** (if on Windows)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd misarh2
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

- OpenAI API key
- Paystack keys
- Flutterwave keys
- SendGrid/SES credentials
- Cloudinary/S3 credentials

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Docker Services

```bash
npm run docker:up
```

This will start:

- PostgreSQL (port 5432)
- Redis (port 6379)
- API (port 3000)
- Web (port 4200)

### 5. Access the Application

- **Web App**: http://localhost:4200
- **API**: http://localhost:3000
- **With Nginx**: http://localhost:8181

## 📁 Project Structure

```
misarh2/
├── apps/
│   ├── api/          # Node.js backend
│   └── web/          # Angular frontend
├── packages/
│   ├── shared/       # Shared TypeScript types
│   ├── database/     # Database migrations
│   └── email-templates/  # Email HTML templates
├── docker/
│   ├── postgres/     # Database initialization
│   └── nginx/        # Nginx configuration
├── docs/             # Documentation
│   ├── requirement documents.docx
│   ├── task.md
│   └── implementation_plan.md
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 🔧 Development

### Run Development Servers

```bash
# Both API and Web
npm run dev

# API only
npm run dev:api

# Web only
npm run dev:web
```

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Database Management

```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

## 🐳 Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Rebuild containers
docker-compose up --build
```

## 📊 Default Credentials

**Admin Account:**

- Email: `admin@misarh.com`
- Password: `admin123`

**⚠️ IMPORTANT**: Change the admin password immediately in production!

## 🎨 The Four Signature Fragrances

1. **INITIATE** - New Beginnings

   - Notes: Powdery Musks, Soft Florals
   - Price: ₦25,000

2. **REVOLT** - Breaking Point

   - Notes: Velvet Spice, Smoldering Woods
   - Price: ₦28,000

3. **LOVER'S SCRIPT** - Sensual Vulnerability

   - Notes: Warm Amber, Soft Leather
   - Price: ₦30,000

4. **ASCEND** - Self-Mastery
   - Notes: Metallic Florals, Magnetic Spices
   - Price: ₦32,000

## 🔐 Environment Variables

Key environment variables to configure:

```env
# Database
DATABASE_HOST=postgres
DATABASE_NAME=misarh_db
DATABASE_USER=misarh_user
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret

# OpenAI
OPENAI_API_KEY=your_openai_key

# Payments
PAYSTACK_SECRET_KEY=your_paystack_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_key

# Email
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=hello@misarh.com

# Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
```

## 📝 API Documentation

API endpoints are available at:

- **Base URL**: `http://localhost:3000`

### Key Endpoints:

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /products` - List products
- `POST /cart` - Add to cart
- `POST /orders` - Create order
- `POST /consultations` - Book consultation
- `GET /admin/analytics` - Admin analytics

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📱 Mobile Development

The Angular web app is fully responsive and can be accessed on mobile devices. A future React Native mobile app is planned.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

Proprietary - All rights reserved

## 👥 Support

For support, email: hello@misarh.com

## 🗺️ Roadmap

- [ ] Phase 1: Infrastructure & Backend Core ✅
- [ ] Phase 2: Product & Shop Features
- [ ] Phase 3: AI Consultation System
- [ ] Phase 4: Customer Dashboard
- [ ] Phase 5: Admin Dashboard
- [ ] Phase 6: Frontend Implementation
- [ ] Phase 7: Testing & Deployment
- [ ] Phase 8: Mobile App (React Native)

---

**Built with ❤️ for MISARH - Fragrance for every self you've ever been.**
