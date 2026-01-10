-- MISARH Database Initialization Script
-- PostgreSQL 16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    emotion_story TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    scent_notes JSONB DEFAULT '{}',
    family VARCHAR(100),
    images JSONB DEFAULT '[]',
    stock_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipping_address JSONB,
    tracking_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    size VARCHAR(20),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    questionnaire_data JSONB DEFAULT '{}',
    ai_profile JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'booked',
    booking_fee DECIMAL(10,2) DEFAULT 30000.00,
    booking_fee_paid BOOLEAN DEFAULT FALSE,
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom formulas table
CREATE TABLE IF NOT EXISTS custom_formulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    fragrance_name VARCHAR(255),
    bottle_number VARCHAR(50),
    ingredients JSONB DEFAULT '[]',
    mixing_notes TEXT,
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    tier VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    next_delivery_date DATE,
    frequency VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Availability slots table
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL,
    time_slot TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(day_of_week, time_slot)
);

-- Booked slots table
CREATE TABLE IF NOT EXISTS booked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, time_slot)
);

-- Scent profiles table
CREATE TABLE IF NOT EXISTS scent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
    preferences_vector JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, product_id)
);

-- Cart table
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    size VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, product_id, size)
);

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20),
    discount_value DECIMAL(10,2),
    min_order_value DECIMAL(10,2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_customer ON consultations(customer_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_family ON products(family);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_wishlist_customer ON wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_customer ON carts(customer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_formulas_updated_at BEFORE UPDATE ON custom_formulas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scent_profiles_updated_at BEFORE UPDATE ON scent_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash generated with bcrypt for 'admin123'
INSERT INTO customers (email, password_hash, name, is_admin) VALUES
('admin@misarh.com', '$2b$10$rBV2kzM7aU3zPzFGx/3zNeTqFHZL6y.31h7YYvJ5dkX8Yh8kJ9eBu', 'Admin User', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert the 4 signature fragrances
INSERT INTO products (name, slug, description, emotion_story, base_price, scent_notes, family, images) VALUES
(
    'INITIATE',
    'initiate',
    'New Beginnings',
    'Powdery musks, soft florals, skin-like warmth. The scent of divine first steps. Courageous, fresh—never naive. This is not arrival. This is choosing to begin.',
    25000.00,
    '{"top": ["Bergamot", "Lemon"], "heart": ["Powdery Musk", "Soft Florals", "White Tea"], "base": ["Sandalwood", "Vanilla"]}',
    'Fresh',
    '[]'
),
(
    'REVOLT',
    'revolt',
    'Breaking Point',
    'Velvet spice, smoldering woods. The moment you no longer bend. Power reclaimed, boundaries claimed. This is the scent of choosing yourself.',
    28000.00,
    '{"top": ["Black Pepper", "Cardamom"], "heart": ["Velvet Spice", "Incense"], "base": ["Smoldering Woods", "Amber", "Patchouli"]}',
    'Spicy',
    '[]'
),
(
    'LOVER''S SCRIPT',
    'lovers-script',
    'Sensual Vulnerability',
    'Warm amber, soft leather. Intimacy without fear. The courage to be seen fully, loved deeply. This is tenderness as strength.',
    30000.00,
    '{"top": ["Pink Pepper", "Saffron"], "heart": ["Rose", "Jasmine"], "base": ["Warm Amber", "Soft Leather", "Oud"]}',
    'Oriental',
    '[]'
),
(
    'ASCEND',
    'ascend',
    'Self-Mastery',
    'Metallic florals, magnetic spices. Elevation without apology. The scent of owning your throne. This is power that knows its own boundaries.',
    32000.00,
    '{"top": ["Iris", "Litchi"], "heart": ["Metallic Florals", "Tuberose"], "base": ["Magnetic Spices", "Cedarwood", "Tonka Bean"]}',
    'Floral',
    '[]'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert default availability slots (Monday to Friday, 10 AM to 4 PM)
INSERT INTO availability_slots (day_of_week, time_slot, is_available) VALUES
-- Monday (1)
(1, '10:00:00', TRUE),
(1, '11:30:00', TRUE),
(1, '13:00:00', TRUE),
(1, '14:30:00', TRUE),
-- Tuesday (2)
(2, '10:00:00', TRUE),
(2, '11:30:00', TRUE),
(2, '13:00:00', TRUE),
(2, '14:30:00', TRUE),
-- Wednesday (3)
(3, '10:00:00', TRUE),
(3, '11:30:00', TRUE),
(3, '13:00:00', TRUE),
(3, '14:30:00', TRUE),
-- Thursday (4)
(4, '10:00:00', TRUE),
(4, '11:30:00', TRUE),
(4, '13:00:00', TRUE),
(4, '14:30:00', TRUE),
-- Friday (5)
(5, '10:00:00', TRUE),
(5, '11:30:00', TRUE),
(5, '13:00:00', TRUE),
(5, '14:30:00', TRUE)
ON CONFLICT (day_of_week, time_slot) DO NOTHING;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'MISARH database initialized successfully!';
    RAISE NOTICE 'Default admin credentials: admin@misarh.com / admin123';
    RAISE NOTICE 'IMPORTANT: Change the admin password in production!';
END $$;
