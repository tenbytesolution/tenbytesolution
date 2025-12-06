const express = require('express');
const router = express.Router();
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');
const { singleUpload, handleUploadError } = require('../middleware/uploadMiddleware');

// Import controllers
const AuthController = require('../controllers/authController');
const CompanyController = require('../controllers/companyController');
const ServiceController = require('../controllers/serviceController');
const PortfolioController = require('../controllers/portfolioController');
const TestimonialController = require('../controllers/testimonialController');
const ContactController = require('../controllers/contactController');
const BannerController = require('../controllers/bannerController');
const BlogController = require('../controllers/blogController');

// Apply authentication and authorization to all admin routes
router.use(authenticate);
router.use(authorizeAdmin);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const pool = require('../config/database');
    
    // Get statistics from all models
    const [[userCount]] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [[serviceCount]] = await pool.execute('SELECT COUNT(*) as count FROM services WHERE is_active = true');
    const [[portfolioCount]] = await pool.execute('SELECT COUNT(*) as count FROM portfolios');
    const [[testimonialCount]] = await pool.execute('SELECT COUNT(*) as count FROM testimonials WHERE is_approved = true');
    const [[messageCount]] = await pool.execute('SELECT COUNT(*) as count FROM contact_messages WHERE status = "new"');
    const [[blogCount]] = await pool.execute('SELECT COUNT(*) as count FROM blogs WHERE is_published = true');

    res.json({
      success: true,
      data: {
        users: userCount.count,
        services: serviceCount.count,
        portfolios: portfolioCount.count,
        testimonials: testimonialCount.count,
        newMessages: messageCount.count,
        blogs: blogCount.count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching dashboard data' 
    });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const pool = require('../config/database');
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Company profile management
router.get('/company', CompanyController.getProfile);
router.put('/company', CompanyController.updateProfile);
router.post('/company/upload-logo', 
  singleUpload('logo'), 
  handleUploadError, 
  CompanyController.uploadLogo
);
router.post('/company/upload-hero', 
  singleUpload('hero_image'), 
  handleUploadError, 
  CompanyController.uploadHeroImage
);

// Services management
router.get('/services', ServiceController.adminGetAllServices);
router.get('/services/:id', ServiceController.adminGetServiceById);
router.post('/services', ServiceController.createService);
router.put('/services/:id', ServiceController.updateService);
router.delete('/services/:id', ServiceController.deleteService);
router.patch('/services/:id/toggle-status', ServiceController.toggleServiceStatus);

// Portfolio management
router.get('/portfolios', PortfolioController.adminGetAllPortfolios);
router.get('/portfolios/:id', PortfolioController.adminGetPortfolioById);
router.post('/portfolios', PortfolioController.createPortfolio);
router.put('/portfolios/:id', PortfolioController.updatePortfolio);
router.delete('/portfolios/:id', PortfolioController.deletePortfolio);
router.patch('/portfolios/:id/toggle-featured', PortfolioController.toggleFeaturedStatus);
router.get('/portfolios/statistics', PortfolioController.getStatistics);

// Testimonials management
router.get('/testimonials', TestimonialController.adminGetAllTestimonials);
router.get('/testimonials/:id', TestimonialController.adminGetTestimonialById);
router.post('/testimonials', TestimonialController.createTestimonial);
router.put('/testimonials/:id', TestimonialController.updateTestimonial);
router.delete('/testimonials/:id', TestimonialController.deleteTestimonial);
router.patch('/testimonials/:id/toggle-approval', TestimonialController.toggleApprovalStatus);
// KEMBALIKAN ROUTES INI:
router.get('/testimonials/statistics', TestimonialController.getStatistics);
router.patch('/testimonials/display-order', TestimonialController.updateDisplayOrder);

// Contact messages management
router.get('/messages', ContactController.getAllMessages);
router.get('/messages/:id', ContactController.getMessageById);
router.put('/messages/:id/status', ContactController.updateMessageStatus);
router.delete('/messages/:id', ContactController.deleteMessage);
router.get('/messages/statistics', ContactController.getStatistics);

// Banner management
router.get('/banners', BannerController.adminGetAllBanners);
router.get('/banners/:id', BannerController.adminGetBannerById);
router.post('/banners', BannerController.createBanner);
router.put('/banners/:id', BannerController.updateBanner);
router.delete('/banners/:id', BannerController.deleteBanner);
router.patch('/banners/:id/toggle-active', BannerController.toggleActiveStatus);
// KEMBALIKAN ROUTES INI:
router.get('/banners/statistics', BannerController.getStatistics);
router.patch('/banners/display-order', BannerController.updateDisplayOrder);

// Blog management
router.get('/blogs', BlogController.adminGetAllBlogs);
router.get('/blogs/:id', BlogController.adminGetBlogById);
router.post('/blogs', BlogController.createBlog);
router.put('/blogs/:id', BlogController.updateBlog);
router.delete('/blogs/:id', BlogController.deleteBlog);
router.patch('/blogs/:id/toggle-publish', BlogController.togglePublishStatus);
// KEMBALIKAN ROUTES INI (LINE 135):
router.get('/blogs/statistics', BlogController.getStatistics);
router.get('/blogs/categories', BlogController.getCategories);

module.exports = router;