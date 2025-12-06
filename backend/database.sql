-- Database: company_profile_db
CREATE DATABASE IF NOT EXISTS company_profile_db;
USE company_profile_db;

-- Table: users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor') DEFAULT 'editor',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: company_profile
CREATE TABLE company_profile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    vision TEXT,
    mission TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    whatsapp VARCHAR(20),
    logo VARCHAR(255),
    hero_image VARCHAR(255),
    about_image VARCHAR(255),
    social_facebook VARCHAR(255),
    social_instagram VARCHAR(255),
    social_linkedin VARCHAR(255),
    social_twitter VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: services
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    long_description TEXT,
    icon_image VARCHAR(255),
    cover_image VARCHAR(255),
    feature_list JSON,
    price_start_from DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: portfolios
CREATE TABLE portfolios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    project_type VARCHAR(100),
    tech_stack JSON,
    project_url VARCHAR(255),
    thumbnail VARCHAR(255),
    images JSON,
    is_featured BOOLEAN DEFAULT false,
    completion_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: testimonials
CREATE TABLE testimonials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(100) NOT NULL,
    position_company VARCHAR(255),
    message TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    image VARCHAR(255),
    is_approved BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: contact_messages
CREATE TABLE contact_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    response TEXT,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: banners
CREATE TABLE banners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    section_name VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    description TEXT,
    image VARCHAR(255),
    button_text VARCHAR(50),
    button_link VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: blogs
CREATE TABLE blogs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content LONGTEXT,
    thumbnail VARCHAR(255),
    tags JSON,
    author_id INT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP NULL,
    view_count INT DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin', 'admin@tenbyte.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye0r8Jq.6rF6yC6Jx7WcR2c6xU1Tvq6W2', 'admin');

-- Insert default company profile
INSERT INTO company_profile (company_name, tagline, email, phone) VALUES 
('Tenbyte Solution', 'Your Technology Partner', 'info@tenbyte.com', '+62123456789');

-- Insert default banners
INSERT INTO banners (section_name, title, subtitle, button_text, button_link) VALUES
('hero', 'Innovative Digital Solutions', 'We help businesses grow with cutting-edge technology', 'Our Services', '/services'),
('about', 'About Our Company', 'Leading the digital transformation journey', 'Learn More', '/about');

-- Create indexes
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_portfolios_featured ON portfolios(is_featured);
CREATE INDEX idx_testimonials_approved ON testimonials(is_approved);
CREATE INDEX idx_blogs_published ON blogs(is_published, published_at);
CREATE INDEX idx_contact_status ON contact_messages(status, created_at);