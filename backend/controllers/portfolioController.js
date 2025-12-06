const Portfolio = require('../models/Portfolio');
const slugify = require('slugify');

class PortfolioController {
  // Get all portfolios (public)
  static async getAllPortfolios(req, res) {
    try {
      const { limit } = req.query;
      const portfolios = await Portfolio.findAll(false, limit ? parseInt(limit) : null);
      
      res.json({
        success: true,
        data: portfolios
      });
    } catch (error) {
      console.error('Get portfolios error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get featured portfolios (public)
  static async getFeaturedPortfolios(req, res) {
    try {
      const { limit } = req.query;
      const portfolios = await Portfolio.findAll(true, limit ? parseInt(limit) : 6);
      
      res.json({
        success: true,
        data: portfolios
      });
    } catch (error) {
      console.error('Get featured portfolios error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get portfolio by slug (public)
  static async getPortfolioBySlug(req, res) {
    try {
      const { slug } = req.params;
      const portfolio = await Portfolio.findBySlug(slug);
      
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      // Parse JSON fields
      if (portfolio.tech_stack) {
        portfolio.tech_stack = JSON.parse(portfolio.tech_stack);
      }
      if (portfolio.images) {
        portfolio.images = JSON.parse(portfolio.images);
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      console.error('Get portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get all portfolios (admin)
  static async adminGetAllPortfolios(req, res) {
    try {
      const portfolios = await Portfolio.findAll(false);
      
      res.json({
        success: true,
        data: portfolios
      });
    } catch (error) {
      console.error('Admin get portfolios error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get portfolio by ID (admin)
  static async adminGetPortfolioById(req, res) {
    try {
      const { id } = req.params;
      const portfolio = await Portfolio.findById(id);
      
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      console.error('Admin get portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Create portfolio (admin)
  static async createPortfolio(req, res) {
    try {
      const {
        project_name,
        client_name,
        description,
        project_type,
        tech_stack,
        project_url,
        thumbnail,
        images,
        completion_date
      } = req.body;

      // Generate slug
      const slug = slugify(project_name, { 
        lower: true,
        strict: true,
        locale: 'id'
      });

      const portfolioData = {
        project_name,
        client_name,
        slug,
        description,
        project_type,
        tech_stack: tech_stack ? JSON.parse(tech_stack) : null,
        project_url,
        thumbnail,
        images: images ? JSON.parse(images) : null,
        completion_date
      };

      const portfolio = await Portfolio.create(portfolioData);

      res.status(201).json({
        success: true,
        message: 'Portfolio created successfully',
        data: portfolio
      });
    } catch (error) {
      console.error('Create portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update portfolio (admin)
  static async updatePortfolio(req, res) {
    try {
      const { id } = req.params;
      const {
        project_name,
        client_name,
        description,
        project_type,
        tech_stack,
        project_url,
        thumbnail,
        images,
        completion_date,
        is_featured
      } = req.body;

      const updateData = {
        project_name,
        client_name,
        description,
        project_type,
        tech_stack: tech_stack ? JSON.parse(tech_stack) : undefined,
        project_url,
        thumbnail,
        images: images ? JSON.parse(images) : undefined,
        completion_date,
        is_featured
      };

      // If project name changed, update slug
      if (project_name) {
        const currentPortfolio = await Portfolio.findById(id);
        if (currentPortfolio && currentPortfolio.project_name !== project_name) {
          updateData.slug = slugify(project_name, { 
            lower: true,
            strict: true,
            locale: 'id'
          });
        }
      }

      // Filter out undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedPortfolio = await Portfolio.update(id, updateData);

      res.json({
        success: true,
        message: 'Portfolio updated successfully',
        data: updatedPortfolio
      });
    } catch (error) {
      console.error('Update portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete portfolio (admin)
  static async deletePortfolio(req, res) {
    try {
      const { id } = req.params;
      
      await Portfolio.delete(id);

      res.json({
        success: true,
        message: 'Portfolio deleted successfully'
      });
    } catch (error) {
      console.error('Delete portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Toggle featured status (admin)
  static async toggleFeaturedStatus(req, res) {
    try {
      const { id } = req.params;
      
      const newStatus = await Portfolio.toggleFeatured(id);

      res.json({
        success: true,
        message: `Portfolio ${newStatus ? 'marked as featured' : 'removed from featured'}`,
        data: { is_featured: newStatus }
      });
    } catch (error) {
      console.error('Toggle featured status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get portfolio statistics (admin)
  static async getStatistics(req, res) {
    try {
      const statistics = await Portfolio.getStatistics();
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get portfolio statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = PortfolioController;
