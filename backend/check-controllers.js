const fs = require('fs');
const path = require('path');

console.log('🔍 Checking controller functions...');

// Daftar controller dan fungsi yang harus ada
const requiredFunctions = {
  'companyController': ['getProfile', 'updateProfile', 'uploadLogo', 'uploadHeroImage'],
  'serviceController': ['getAllServices', 'getServiceBySlug', 'adminGetAllServices', 'adminGetServiceById', 'createService', 'updateService', 'deleteService', 'toggleServiceStatus'],
  'portfolioController': ['getAllPortfolios', 'getFeaturedPortfolios', 'getPortfolioBySlug', 'adminGetAllPortfolios', 'adminGetPortfolioById', 'createPortfolio', 'updatePortfolio', 'deletePortfolio', 'toggleFeaturedStatus', 'getStatistics'],
  'testimonialController': ['getAllTestimonials', 'getTestimonialsStats', 'submitPublicTestimonial', 'adminGetAllTestimonials', 'adminGetTestimonialById', 'createTestimonial', 'updateTestimonial', 'deleteTestimonial', 'toggleApprovalStatus', 'getStatistics', 'updateDisplayOrder'],
  'contactController': ['submitMessage', 'getAllMessages', 'getMessageById', 'updateMessageStatus', 'deleteMessage', 'getStatistics'],
  'bannerController': ['getAllBanners', 'getBannerBySection', 'adminGetAllBanners', 'adminGetBannerById', 'createBanner', 'updateBanner', 'deleteBanner', 'toggleActiveStatus', 'getStatistics', 'updateDisplayOrder'],
  'blogController': ['getAllBlogs', 'getBlogBySlug', 'getCategories', 'adminGetAllBlogs', 'adminGetBlogById', 'createBlog', 'updateBlog', 'deleteBlog', 'togglePublishStatus', 'getStatistics'],
  'authController': ['register', 'login', 'refreshToken', 'getProfile', 'updateProfile', 'logout']
};

// Periksa setiap controller
Object.entries(requiredFunctions).forEach(([controllerName, functions]) => {
  const controllerPath = path.join(__dirname, 'controllers', `${controllerName}.js`);
  
  if (!fs.existsSync(controllerPath)) {
    console.log(`❌ ${controllerName}.js tidak ditemukan!`);
    return;
  }
  
  const content = fs.readFileSync(controllerPath, 'utf8');
  
  console.log(`\n📄 ${controllerName}.js:`);
  
  functions.forEach(func => {
    const functionPattern = new RegExp(`static\\s+async\\s+${func}\\(`);
    if (functionPattern.test(content)) {
      console.log(`  ✓ ${func}() ditemukan`);
    } else {
      console.log(`  ❌ ${func}() TIDAK ditemukan!`);
    }
  });
});

console.log('\n✅ Check selesai!');