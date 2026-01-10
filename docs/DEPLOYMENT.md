# MISARH Platform - Deployment Instructions

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Deployment](#database-deployment)
5. [Service Deployment](#service-deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Prerequisites

### Required Software

- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### For Windows Users

- **WSL2** (Windows Subsystem for Linux 2) must be installed and configured
- Docker Desktop for Windows with WSL2 backend enabled

### Required Accounts & API Keys

Before deployment, obtain the following:

1. **OpenAI API Key** - https://platform.openai.com/api-keys
2. **Paystack Account** - https://dashboard.paystack.com
   - Secret Key
   - Public Key
3. **SendGrid API Key** - https://app.sendgrid.com/settings/api_keys
4. **Cloudinary Account** - https://cloudinary.com/console
   - Cloud Name
   - API Key
   - API Secret

---

## Initial Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd misarh2
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies for the monorepo and all workspaces.

**Expected Output:**

```
added XXX packages in Xs
```

---

## Environment Configuration

### Step 3: Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 4: Configure Environment Variables

Edit the `.env` file with your actual credentials:

```bash
# Use your preferred text editor
nano .env
# or
vim .env
# or
code .env
```

#### Required Variables:

**Database (Default values work for development):**

```env
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=misarh_db
DATABASE_USER=misarh_user
DATABASE_PASSWORD=<CREATE_STRONG_PASSWORD>
```

**JWT Authentication:**

```env
JWT_SECRET=<GENERATE_RANDOM_64_CHAR_STRING>
JWT_EXPIRES_IN=7d
```

**OpenAI API:**

```env
OPENAI_API_KEY=sk-<YOUR_OPENAI_API_KEY>
```

**Paystack Payment Gateway:**

```env
PAYSTACK_SECRET_KEY=sk_live_<YOUR_SECRET_KEY>  # Use sk_test_ for testing
PAYSTACK_PUBLIC_KEY=pk_live_<YOUR_PUBLIC_KEY>  # Use pk_test_ for testing
```

**Email Service (SendGrid):**

```env
SENDGRID_API_KEY=SG.<YOUR_SENDGRID_API_KEY>
EMAIL_FROM=hello@misarh.com
```

**File Storage (Cloudinary):**

```env
CLOUDINARY_CLOUD_NAME=<YOUR_CLOUD_NAME>
CLOUDINARY_API_KEY=<YOUR_API_KEY>
CLOUDINARY_API_SECRET=<YOUR_API_SECRET>
```

#### Generate Secure JWT Secret:

```bash
# Linux/Mac/WSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Deployment

### Step 5: Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
npm run docker:up
```

**Alternative command:**

```bash
docker-compose up -d
```

**Expected Output:**

```
[+] Running 2/2
 ✔ Container misarh-redis     Started
 ✔ Container misarh-postgres  Started
```

### Step 6: Verify Database Initialization

Check that all tables were created:

```bash
docker exec misarh-postgres psql -U misarh_user -d misarh_db -c "\dt"
```

**Expected Output:** 14 tables listed

```
 subscriptions
 availability_slots
 customers
 orders
 order_items
 products
 consultations
 custom_formulas
 booked_slots
 scent_profiles
 wishlists
 carts
 promo_codes
 newsletter_subscribers
```

### Step 7: Verify Seed Data

Check that the 4 signature fragrances were inserted:

```bash
docker exec misarh-postgres psql -U misarh_user -d misarh_db -c "SELECT name, slug, base_price FROM products;"
```

**Expected Output:**

```
      name      |     slug      | base_price
----------------+---------------+------------
 INITIATE       | initiate      |   25000.00
 REVOLT         | revolt        |   28000.00
 LOVER'S SCRIPT | lovers-script |   30000.00
 ASCEND         | ascend        |   32000.00
```

Check admin user:

```bash
docker exec misarh-postgres psql -U misarh_user -d misarh_db -c "SELECT email, is_admin FROM customers;"
```

**Expected Output:**

```
      email       | is_admin
------------------+----------
 admin@misarh.com | t
```

---

## Service Deployment

### Database Ports

**PostgreSQL:**

- External Port: `54320` (mapped to avoid conflicts)
- Internal Port: `5432`
- Connection: `localhost:54320`

**Redis:**

- External Port: `6379`
- Internal Port: `6379`
- Connection: `localhost:6379`

### Service Status

Check running services:

```bash
docker-compose ps
```

**Expected Output:**

```
NAME              IMAGE               STATUS
misarh-postgres   postgres:16-alpine  Up (healthy)
misarh-redis      redis:7-alpine      Up (healthy)
```

---

## Verification

### Database Connection Test

#### Test PostgreSQL:

```bash
docker exec misarh-postgres psql -U misarh_user -d misarh_db -c "SELECT version();"
```

**Expected:** PostgreSQL version string displayed

#### Test Redis:

```bash
docker exec misarh-redis redis-cli ping
```

**Expected Output:** `PONG`

### Data Verification

#### Count Products:

```bash
docker exec misarh-postgres psql -U misarh_user -d misarh_db -c "SELECT COUNT(*) FROM products;"
```

**Expected:** `4`

#### Count Availability Slots:

```bash
docker exec misarh-postgres psql -U misarh_user -d misarh_db -c "SELECT COUNT(*) FROM availability_slots;"
```

**Expected:** `20` (4 slots/day × 5 days)

### GUI Database Connection

You can connect to the database using GUI tools:

**Connection Parameters:**

- **Host:** `localhost`
- **Port:** `54320`
- **Database:** `misarh_db`
- **Username:** `misarh_user`
- **Password:** (from your `.env` file)

**Recommended Tools:**

- pgAdmin
- DBeaver
- TablePlus
- DataGrip

---

## Troubleshooting

### Issue: Port Already in Use

**Error Message:**

```
Error: port is already allocated
```

**Solution:**

1. Check what's using the port:

   ```bash
   # Linux/Mac
   lsof -i :54320

   # Windows (PowerShell)
   netstat -ano | findstr :54320
   ```

2. Change the port in `docker-compose.yml`:

   ```yaml
   postgres:
     ports:
       - "DIFFERENT_PORT:5432" # Change DIFFERENT_PORT
   ```

3. Restart services:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Issue: Database Not Initializing

**Symptom:** Tables not created or seed data missing

**Solution:**

1. Stop all services:

   ```bash
   docker-compose down -v
   ```

2. Remove volumes (⚠️ This will delete all data):

   ```bash
   docker volume rm misarh2_postgres_data misarh2_redis_data
   ```

3. Start services again:

   ```bash
   docker-compose up -d
   ```

4. Check logs for errors:
   ```bash
   docker-compose logs postgres
   ```

### Issue: Container Won't Start

**Check container logs:**

```bash
docker-compose logs <service-name>

# Examples:
docker-compose logs postgres
docker-compose logs redis
```

**Check container status:**

```bash
docker ps -a
```

**Remove and recreate:**

```bash
docker-compose down
docker-compose up -d --force-recreate
```

### Issue: Permission Denied Errors

**Linux/WSL users may need:**

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, then test:
docker ps
```

---

## Maintenance

### View Logs

**All services:**

```bash
docker-compose logs -f
```

**Specific service:**

```bash
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Stop Services

**Graceful shutdown:**

```bash
npm run docker:down
```

**Or:**

```bash
docker-compose down
```

### Restart Services

```bash
docker-compose restart
```

**Restart specific service:**

```bash
docker-compose restart postgres
docker-compose restart redis
```

### Backup Database

**Create backup:**

```bash
docker exec misarh-postgres pg_dump -U misarh_user misarh_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore from backup:**

```bash
docker exec -i misarh-postgres psql -U misarh_user -d misarh_db < backup_file.sql
```

### Clean Up

**Remove all containers and volumes (⚠️ DESTRUCTIVE):**

```bash
docker-compose down -v
```

**Remove stopped containers:**

```bash
docker container prune
```

**Remove unused volumes:**

```bash
docker volume prune
```

---

## Production Deployment Notes

### Security Checklist

- [ ] Change default admin password (`admin123`)
- [ ] Use strong database password
- [ ] Generate secure JWT secret (64+ characters)
- [ ] Use production API keys (not test keys)
- [ ] Enable SSL/TLS for database connections
- [ ] Configure firewall rules
- [ ] Enable Docker security scanning
- [ ] Restrict database access to localhost only

### Environment-Specific Settings

**Development:**

```env
NODE_ENV=development
API_URL=http://localhost:3000
WEB_URL=http://localhost:4200
```

**Production:**

```env
NODE_ENV=production
API_URL=https://api.misarh.com
WEB_URL=https://www.misarh.com
```

### Scaling Considerations

**PostgreSQL:**

- Increase `max_connections` in PostgreSQL config
- Configure connection pooling
- Set up read replicas for high traffic

**Redis:**

- Enable persistence (RDB or AOF)
- Configure memory limits
- Set up Redis Sentinel for high availability

### Monitoring

Recommended tools:

- **Database:** pgAdmin, DataDog, New Relic
- **Application:** PM2, Forever, Supervisor
- **Logs:** ELK Stack, Splunk, CloudWatch
- **Uptime:** UptimeRobot, Pingdom

---

## Default Credentials

### Admin Account

**⚠️ FOR DEVELOPMENT ONLY - CHANGE IN PRODUCTION**

- **Email:** `admin@misarh.com`
- **Password:** `admin123`

**To change admin password:**

```bash
# Generate bcrypt hash for new password
docker exec misarh-postgres psql -U misarh_user -d misarh_db -c \
  "UPDATE customers SET password_hash='<NEW_BCRYPT_HASH>' WHERE email='admin@misarh.com';"
```

---

## Service Endpoints

### When API is Deployed:

- **API Server:** `http://localhost:3000`
- **Web App:** `http://localhost:4200`
- **Nginx Proxy:** `http://localhost:8181`

### Database:

- **PostgreSQL:** `localhost:54320`
- **Redis:** `localhost:6379`

---

## Support

### Common Commands Quick Reference

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Check status
docker-compose ps

# Connect to database
docker exec -it misarh-postgres psql -U misarh_user -d misarh_db

# Backup database
docker exec misarh-postgres pg_dump -U misarh_user misarh_db > backup.sql

# View Redis data
docker exec -it misarh-redis redis-cli
```

### Getting Help

1. Check logs: `docker-compose logs <service>`
2. Review this documentation
3. Check GitHub Issues
4. Contact: hello@misarh.com

---

## Next Steps

After successful deployment of infrastructure:

1. ✅ **Phase 1 Complete:** Infrastructure deployed
2. ⏭️ **Phase 2:** Backend API implementation
3. ⏭️ **Phase 3:** Frontend development
4. ⏭️ **Phase 4:** Integration and testing

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-08  
**Maintained By:** MISARH Development Team
