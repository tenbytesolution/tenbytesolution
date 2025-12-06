const express = require('express');
const router = express.Router();

// Import controllers
const CompanyController = require('../controllers/companyController');
const ServiceController = require('../controllers/serviceController');
const PortfolioController = require('../controllers/portfolioController');
const TestimonialController = require('../controllers/testimonialController');
const ContactController = require('../controllers/contactController');
const BannerController = require('../controllers/bannerController');
const BlogController = require('../controllers/blogController');

// Import validation
const { contactValidation } = require('../middleware/validationMiddleware');

// Company profile
router.get('/company', CompanyController.getProfile);

// Services
router.get('/services', ServiceController.getAllServices);
router.get('/services/:slug', ServiceController.getServiceBySlug);

// Portfolios
router.get('/portfolios', PortfolioController.getAllPortfolios);
router.get('/portfolios/featured', PortfolioController.getFeaturedPortfolios);
router.get('/portfolios/:slug', PortfolioController.getPortfolioBySlug);

// Testimonials
router.get('/testimonials', TestimonialController.getAllTestimonials);
router.get('/testimonials/stats', TestimonialController.getTestimonialsStats);
router.post('/testimonials/submit', TestimonialController.submitPublicTestimonial);

// Contact
router.post('/contact', contactValidation.submitMessage, ContactController.submitMessage);

// Banners
router.get('/banners', BannerController.getAllBanners);
router.get('/banners/section/:sectionName', BannerController.getBannerBySection);

// Blogs
router.get('/blogs', BlogController.getAllBlogs);
router.get('/blogs/:slug', BlogController.getBlogBySlug);
router.get('/blogs/categories', BlogController.getCategories);

module.exports = router;