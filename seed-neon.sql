-- Seed Neon DB - Run in Neon SQL Editor (Ctrl+A → Ctrl+Enter)

-- 1. Admin User (admin@esteetade.com / admin123)
INSERT INTO users (email, password, first_name, last_name, role, admin_approved, created_at) VALUES 
('admin@esteetade.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Esteetade', 'admin', true, NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Test Agent
INSERT INTO users (email, password, first_name, last_name, role, created_at) VALUES 
('agent@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test', 'Agent', 'agent', NOW())
ON CONFLICT (email) DO NOTHING;

-- 3. Service Prices (NGN)
INSERT INTO service_prices (service_type, country, price_amount, currency, is_active) VALUES 
('cv', 'Nigeria', 5000, 'NGN', true),
('logo', 'Nigeria', 10000, 'NGN', true),
('website_basic', 'Nigeria', 25000, 'NGN', true),
('social_media', 'Nigeria', 15000, 'NGN', true)
ON CONFLICT DO NOTHING;

-- 4. Website Types
INSERT INTO website_types (name, description) VALUES 
('basic', '5-page static site'),
('standard', 'Full CMS site'),
('ecommerce', 'Shop with payments')
ON CONFLICT DO NOTHING;

-- Verify
SELECT '✅ SEED COMPLETE - Login: admin@esteetade.com / admin123' as message;
SELECT count(*) as total_users FROM users;
SELECT service_type, price_amount from service_prices LIMIT 4;

