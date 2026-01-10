# MISARH Luxury Fragrance Platform - Implementation Plan

## Project Overview

Building a luxury fragrance e-commerce platform as a **monorepo** combining Angular 17+ frontend with Node.js/Express backend, featuring AI-powered custom scent consultations, dynamic pricing, subscription management, and comprehensive admin/customer dashboards.

**Key Technologies:**

- **Frontend**: Angular 17+, SCSS, TypeScript
- **Backend**: Node.js + Express.js, TypeScript
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4 (scent analysis)
- **Payments**: Paystack (primary), Flutterwave (backup)
- **Email**: SendGrid or Amazon SES
- **Storage**: Cloudinary or AWS S3
- **Containerization**: Docker + Docker Compose

---

## User Review Required

> [!IMPORTANT] > **Technology Stack Confirmation**
>
> Based on the requirements and existing localhost site at `http://localhost:8181/`, I'm proposing:
>
> - **Backend**: Node.js + Express.js + TypeScript (modern, matches Angular ecosystem)
> - **Alternative**: Django + DRF is mentioned in requirements - do you have a preference?
>
> **File Storage Provider**
>
> - Cloudinary (easier setup, generous free tier) OR AWS S3 (more scalable)
> - Which do you prefer?
>
> **Email Service Provider**
>
> - SendGrid (simpler API, good free tier) OR Amazon SES (lower cost at scale)
> - Which do you prefer?

> [!WARNING] > **AI Integration Costs**
>
> OpenAI GPT-4 API usage will incur costs per consultation:
>
> - Estimated ~$0.03-0.10 per scent analysis
> - With ₦30,000 booking fee, this is negligible
> - Ensure OpenAI API key and billing are configured

> [!CAUTION] > **Payment Integration Requirements**
>
> You'll need active accounts for:
>
> - **Paystack** (primary): Get API keys from dashboard
> - **Flutterwave** (backup): Get API keys from dashboard
> - Both require business verification for live mode
> - Test mode keys can be used for initial development

---

## Proposed Changes

### Monorepo Structure

```
misarh2/
├── apps/
│   ├── web/                    # Angular 17+ frontend
│   └── api/                    # Node.js + Express backend
├── packages/
│   ├── shared/                 # Shared TypeScript types
│   ├── database/               # Database schemas & migrations
│   └── email-templates/        # Email HTML templates
├── docker/
│   ├── postgres/
│   │   └── init.sql           # Database initialization
│   └── nginx/
│       └── nginx.conf         # Reverse proxy config
├── docs/
│   ├── requirement documents.docx
│   ├── task.md
│   └── implementation_plan.md
├── docker-compose.yml
├── package.json               # Root package.json (workspace)
├── tsconfig.json              # Base TypeScript config
└── .env.example
```

---

### Component 1: Infrastructure & DevOps

#### [NEW] [docker-compose.yml](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\docker-compose.yml)

Docker Compose configuration defining:

- **PostgreSQL** service (database)
- **Redis** service (session/cache)
- **API** service (Node.js backend)
- **Web** service (Angular build served by Nginx)
- **Nginx** service (reverse proxy)

All services networked together with volume persistence.

#### [NEW] [.env.example](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2.env.example)

Environment variables template:

- Database credentials
- JWT secret
- OpenAI API key
- Paystack/Flutterwave keys
- SendGrid/SES credentials
- Cloudinary/S3 configuration

#### [NEW] [docker/postgres/init.sql](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\docker\postgres\init.sql)

PostgreSQL initialization script creating:

- Database schema
- All tables (customers, products, orders, consultations, etc.)
- Indexes for performance
- Initial admin user

---

### Component 2: Shared Packages

#### [NEW] [packages/shared/src/types.ts](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\packages\shared\src\types.ts)

Shared TypeScript interfaces:

- `Customer`, `Product`, `Order`, `Consultation`
- `ScentProfile`, `CustomFormula`, `Subscription`
- API request/response types
- Constants (scent families, status enums)

#### [NEW] [packages/email-templates/](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\packages\email-templates)

HTML email templates:

- `order-confirmation.html`
- `consultation-booking.html` (includes AI profile)
- `shipping-notification.html`
- `custom-fragrance-ready.html`
- `subscription-reminder.html`
- `newsletter.html`

---

### Component 3: Backend API (Node.js + Express)

#### [NEW] [apps/api/src/server.ts](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\api\src\server.ts)

Express server entry point:

- Middleware setup (CORS, body-parser, helmet)
- Route registration
- Error handling
- Database connection

#### [NEW] [apps/api/src/config/database.ts](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\api\src\config\database.ts)

PostgreSQL connection using `pg` or an ORM like TypeORM/Prisma:

- Connection pooling
- Query builders
- Migration support

#### [NEW] [apps/api/src/middleware/auth.ts](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\api\src\middleware\auth.ts)

JWT authentication middleware:

- Token validation
- User/admin role checking
- Request user injection

#### [NEW] [apps/api/src/routes/](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\api\src\routes)

API route modules:

- `auth.routes.ts` - Login, signup, password reset
- `products.routes.ts` - CRUD, filtering, search
- `cart.routes.ts` - Add, remove, update quantities
- `orders.routes.ts` - Create, retrieve, update status
- `consultations.routes.ts` - Booking flow, AI analysis
- `customers.routes.ts` - Profile, history, preferences
- `admin.routes.ts` - Dashboard, analytics, management
- `payments.routes.ts` - Paystack/Flutterwave webhooks
- `subscriptions.routes.ts` - Manage subscriptions

---

### Component 4: AI Integration

#### [NEW] [apps/api/src/services/ai.service.ts](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\api\src\services\ai.service.ts)

OpenAI GPT-4 integration:

- **`analyzeScentProfile(questionnaire)`** - Sends structured prompt to GPT-4
- Parses JSON response into `ScentProfile` format
- Handles errors and retries
- Stores analysis in database

Example prompt structure:

```javascript
const prompt = `You are an expert perfumer. Analyze this questionnaire and return a JSON scent profile:

Loves: ${questionnaire.lovesScents}
Avoids: ${questionnaire.avoidsScents}
Emotions: ${questionnaire.desiredEmotions}
Lifestyle: ${questionnaire.lifestyle.join(", ")}

Return JSON with: dominantFamily, intensity, recommendedBase, recommendedHeart, recommendedTop, personality, mixingNotes`;
```

#### [NEW] [apps/api/src/services/recommendation.service.ts](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\api\src\services\recommendation.service.ts)

Scent recommendation algorithm:

- Analyzes customer purchase history
- Builds scent preference vector (floral, woody, fresh, etc.)
- Compares with product vectors
- Returns top 3 recommended products

---

### Component 5: Payment Integration

#### [NEW] [apps/api/src/services/payment.service.ts](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\api\src\services\payment.service.ts)

Unified payment service supporting:

- **Paystack**: Initialize transaction, verify payment
- **Flutterwave**: Initialize transaction, verify payment
- **Webhook handlers** for payment confirmations
- Partial payments (consultation deposits)

#### [NEW] [apps/api/src/routes/webhooks.routes.ts](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\api\src\routes\webhooks.routes.ts)

Webhook endpoints:

- `/webhooks/paystack` - Handle Paystack events
- `/webhooks/flutterwave` - Handle Flutterwave events
- Signature verification for security
- Update order/consultation status

---

### Component 6: Email Service

#### [NEW] [apps/api/src/services/email.service.ts](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\api\src\services\email.service.ts)

Email sending service:

- SendGrid or SES integration
- Template rendering with variables
- Send order confirmations
- Send consultation bookings with AI profiles
- Send newsletters

---

### Component 7: Database Schema

#### [NEW] [packages/database/migrations/001_initial_schema.sql](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\packages\database\migrations\001_initial_schema.sql)

Complete PostgreSQL schema:

```sql
-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    emotion_story TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    scent_notes JSONB, -- {top: [], heart: [], base: []}
    family VARCHAR(100), -- Fresh, Floral, Woody, Oriental, Spicy
    images JSONB, -- Array of image URLs
    stock_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_address JSONB,
    tracking_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    size VARCHAR(20), -- 15ml, 30ml, 50ml, 100ml
    price DECIMAL(10,2) NOT NULL
);

-- Consultations table
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    questionnaire_data JSONB,
    ai_profile JSONB,
    status VARCHAR(50) DEFAULT 'booked',
    booking_fee_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom formulas table
CREATE TABLE custom_formulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id),
    customer_id UUID REFERENCES customers(id),
    fragrance_name VARCHAR(255),
    bottle_number VARCHAR(50),
    ingredients JSONB, -- [{name, percentage, notes}]
    mixing_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    tier VARCHAR(50), -- Discovery, Premium, etc.
    status VARCHAR(50) DEFAULT 'active',
    next_delivery_date DATE,
    frequency VARCHAR(50), -- monthly, quarterly
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Availability slots table
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
    time_slot TIME,
    is_available BOOLEAN DEFAULT TRUE
);

-- Booked slots table
CREATE TABLE booked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id),
    date DATE NOT NULL,
    time_slot TIME NOT NULL
);

-- Scent profiles table
CREATE TABLE scent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) UNIQUE,
    preferences_vector JSONB, -- {floral: 0.6, woody: 0.3, ...}
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist table
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    product_id UUID REFERENCES products(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, product_id)
);

-- Promo codes table
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20), -- percentage, fixed
    discount_value DECIMAL(10,2),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_consultations_customer ON consultations(customer_id);
CREATE INDEX idx_consultations_date ON consultations(date);
CREATE INDEX idx_products_slug ON products(slug);
```

---

### Component 8: Frontend Web App (Angular 17+)

#### [NEW] [apps/web/src/](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\web\src)

Angular project structure:

- `app/` - Application modules and components
- `assets/` - Images, fonts, static files
- `styles/` - Global SCSS files
- `environments/` - Environment configurations

#### [NEW] [apps/web/src/styles/variables.scss](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\web\src\styles\variables.scss)

SCSS variables for brand identity:

```scss
// MISARH Brand Colors
$ivory: #f8f5f0;
$charcoal: #2c2c2c;
$gold: #b8985f;
$soft-grey: #e5e1da;
$deep-brown: #4a4a4a;

// Typography
$font-serif: "Cormorant Garamond", serif;
$font-sans: "Montserrat", sans-serif;

// Animations
$transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

#### [NEW] [apps/web/src/app/core/](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\web\src\app\core)

Core services and guards:

- `auth.service.ts` - Authentication, JWT storage
- `api.service.ts` - HTTP client wrapper
- `auth.guard.ts` - Route protection
- `admin.guard.ts` - Admin-only routes

#### [NEW] [apps/web/src/app/pages/](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\web\src\app\pages)

Page components:

- `home/` - Landing page
- `shop/` - Product grid with filters
- `product-detail/` - Individual fragrance pages
- `cart/` - Shopping cart
- `checkout/` - Checkout flow
- `about/` - Brand story
- `contact/` - Contact form
- `consultation/` - 4-step booking flow
- `dashboard/` - Customer dashboard
- `admin/` - Admin dashboard

#### [NEW] [apps/web/src/app/shared/components/](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\apps\web\src\app\shared\components)

Reusable components:

- `header/` - Navigation bar
- `footer/` - Footer with links
- `fragrance-card/` - Product card
- `scent-radar-chart/` - AI profile visualization
- `calendar-picker/` - Consultation date selector
- `loading-spinner/` - Loading states
- `modal/` - Modal dialogs

---

### Component 9: Key Frontend Features

#### Landing Page (Home Component)

Implements:

- Cinematic hero section with fade-in animations
- "Chapter One: The Becoming" section with 4 fragrances
- Interactive scroll animations (parallax, fade-ins)
- Newsletter signup form
- Testimonials carousel
- Brand story sections

#### Individual Fragrance Pages

Dynamic route: `/fragrance/:slug`

Features:

- Immersive hero with fragrance-specific imagery
- Emotion story section (long-form narrative)
- Scent journey timeline (top/heart/base notes)
- "Who this is for" personality matching
- Size selection (15ml, 20ml, 30ml, 50ml, 100ml)
- Dynamic pricing calculator
- Add to cart functionality
- Related fragrances recommendations
- Social sharing buttons

#### Consultation Booking Flow

4-step wizard component:

1. **Scent Questionnaire** - Form with text areas and checkboxes
2. **AI Analysis Preview** - Display generated scent profile
3. **Date & Time Selection** - Calendar with available slots
4. **Payment** - Paystack/Flutterwave integration (₦30,000)

Real-time AI analysis displayed in step 2.

#### Customer Dashboard

Tabs/sections:

- **Profile** - Edit personal information
- **Order History** - List of all orders with details
- **Consultations** - Past consultations with AI profiles
- **Scent Chart** - Radar chart visualization (using Chart.js or D3.js)
- **Subscriptions** - Manage subscription settings

#### Admin Dashboard

Comprehensive admin interface:

- **Consultations** - Calendar view, upcoming bookings
- **Formula Recording** - Form to input custom formulas
- **Customers** - Searchable database
- **Products** - CRUD interface
- **Orders** - List with status updates
- **Analytics** - Revenue charts, metrics

---

### Component 10: Deployment Configuration

#### [NEW] [docker-compose.prod.yml](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2\docker-compose.prod.yml)

Production-optimized Docker Compose:

- Build Angular with `--configuration=production`
- Use production database credentials
- Enable SSL/TLS
- Configure resource limits

#### [NEW] [.github/workflows/deploy.yml](file:///\wsl.localhost\Ubuntu\home\crysto\projects\aisha\misarh2.github\workflows\deploy.yml)

CI/CD pipeline:

- Run tests on push
- Build Docker images
- Deploy to server (VPS/Cloud)
- Run database migrations

---

## Verification Plan

### Automated Tests

**Backend API Tests:**

```bash
# Unit tests for services
npm run test --workspace=apps/api

# Integration tests for API endpoints
npm run test:integration --workspace=apps/api
```

**Frontend Tests:**

```bash
# Unit tests for components
npm run test --workspace=apps/web

# E2E tests with Cypress
npm run test:e2e --workspace=apps/web
```

**Test Coverage:**

- Authentication flows (login, signup, JWT)
- Payment processing (Paystack/Flutterwave mocks)
- AI scent analysis (OpenAI mock responses)
- Consultation booking flow
- Order creation and checkout

---

### Manual Verification

#### 1. Local Development Setup

```bash
# Clone repository
git clone <repo-url>
cd misarh2

# Install dependencies
npm install

# Start Docker services
docker-compose up -d

# Run database migrations
npm run migrate

# Start development servers
npm run dev
```

Verify:

- [ ] PostgreSQL accessible at `localhost:5432`
- [ ] API running at `http://localhost:3000`
- [ ] Angular dev server at `http://localhost:4200`
- [ ] No console errors

#### 2. Public Website Testing

- [ ] Landing page loads with animations
- [ ] Navigate to `/fragrance/initiate`, `/fragrance/revolt`, `/fragrance/lovers-script`, `/fragrance/ascend`
- [ ] Add products to cart
- [ ] View cart and apply promo code
- [ ] Complete checkout flow (test mode)
- [ ] Verify email confirmation sent

#### 3. Consultation Flow Testing

- [ ] Fill out scent questionnaire
- [ ] Verify AI analysis displayed within 5 seconds
- [ ] Select available date/time slot
- [ ] Complete payment (₦30,000 test)
- [ ] Verify booking confirmation email with AI profile

#### 4. Customer Dashboard Testing

- [ ] Login as customer
- [ ] View order history
- [ ] View consultation history with AI profiles
- [ ] Check scent radar chart visualization
- [ ] Subscribe to monthly delivery
- [ ] Reorder past purchase

#### 5. Admin Dashboard Testing

- [ ] Login as admin
- [ ] Set availability schedule (block dates, add time slots)
- [ ] View upcoming consultations
- [ ] Record custom formula for a consultation
- [ ] Update order status (Pending → Shipped)
- [ ] View analytics dashboard (revenue, top products)

#### 6. Payment Integration Verification

- [ ] Test Paystack checkout (card payment)
- [ ] Test Flutterwave checkout (bank transfer)
- [ ] Verify webhooks update order status
- [ ] Test partial payment for consultations

#### 7. AI Integration Verification

- [ ] Submit consultation questionnaire
- [ ] Verify OpenAI API called successfully
- [ ] Confirm JSON response parsed correctly
- [ ] Verify scent profile stored in database
- [ ] Check email contains AI analysis

#### 8. Responsive Design Testing

- [ ] Test on mobile (375px, 414px widths)
- [ ] Test on tablet (768px, 1024px widths)
- [ ] Test on desktop (1440px, 1920px widths)
- [ ] Verify touch interactions on mobile

#### 9. Performance Testing

- [ ] Lighthouse audit (target: >90 performance score)
- [ ] Page load times <2 seconds
- [ ] API response times <500ms
- [ ] Image optimization (WebP format, lazy loading)

#### 10. Security Testing

- [ ] Verify JWT tokens expire correctly
- [ ] Test SQL injection protection
- [ ] Verify CORS policy
- [ ] Test CSRF protection
- [ ] Verify password hashing (bcrypt)
- [ ] Test webhook signature verification

---

## Migration from Existing Site

> [!NOTE] > **Assets from localhost:8181**
>
> Based on browser exploration, the following assets should be migrated:
>
> - Logo SVG: `http://localhost:8181/assets/images/Logo.svg`
> - Product images for INITIATE, REVOLT, LOVER'S SCRIPT, ASCEND
> - Background imagery (currently using Pexels external link)
>
> These should be copied to `apps/web/src/assets/images/` directory.

**Data Migration:**

- If existing products in database, export and import into PostgreSQL
- Ensure fragrance descriptions match requirements document
- Verify scent note data (top/heart/base) for all 4 products

---

## Timeline Estimate

- **Phase 1-2 (Infrastructure + Backend Core)**: 1-2 weeks
- **Phase 3-4 (Shop + AI Features)**: 2-3 weeks
- **Phase 5-6 (Dashboards Backend)**: 1-2 weeks
- **Phase 7-8 (Frontend Core + Public Pages)**: 2-3 weeks
- **Phase 9-11 (Consultation + Dashboards Frontend)**: 3-4 weeks
- **Phase 12-13 (Testing + Deployment)**: 1-2 weeks

**Total Estimated Time**: 10-16 weeks (2.5-4 months)

---

## Next Steps

1. **Review and approve this implementation plan**
2. **Confirm technology choices** (Node.js vs Django, Cloudinary vs S3, etc.)
3. **Set up accounts** (OpenAI, Paystack, Flutterwave, SendGrid/SES)
4. **Begin Phase 1**: Initialize monorepo structure and Docker setup
