const Banner = require('../models/Banner');
const pool = require('../config/database');

class BannerController {
  // Get all active banners (public)
  static async getAllBanners(req, res) {
    try {
      const banners = await Banner.findAll();
      
      res.json({
        success: true,
        data: banners
      });
    } catch (error) {
      console.error('Get banners error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching banners'
      });
    }
  }

  // Get banner by section name (public)
  static async getBannerBySection(req, res) {
    try {
      const { sectionName } = req.params;
      
      if (!sectionName) {
        return res.status(400).json({
          success: false,
          message: 'Section name is required'
        });
      }

      const banner = await Banner.findBySection(sectionName);
      
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found for this section'
        });
      }

      res.json({
        success: true,
        data: banner
      });
    } catch (error) {
      console.error('Get banner by section error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get all banners (admin - includes inactive)
  static async adminGetAllBanners(req, res) {
    try {
      const { activeOnly = 'false' } = req.query;
      const banners = await Banner.findAll(activeOnly === 'true');
      
      res.json({
        success: true,
        count: banners.length,
        data: banners
      });
    } catch (error) {
      console.error('Admin get banners error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching banners'
      });
    }
  }

  // Get single banner by ID (admin)
  static async adminGetBannerById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid banner ID is required'
        });
      }

      const banner = await Banner.findById(parseInt(id));
      
      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        });
      }

      res.json({
        success: true,
        data: banner
      });
    } catch (error) {
      console.error('Get banner by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Create new banner (admin)
  static async createBanner(req, res) {
    try {
      const {
        section_name,
        title,
        subtitle,
        description,
        image,
        button_text,
        button_link,
        display_order = 0,
        is_active = true
      } = req.body;

      // Validation
      if (!section_name || !section_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Section name is required'
        });
      }

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      // Check if section name already exists
      const existingBanner = await Banner.findBySection(section_name);
      if (existingBanner) {
        return res.status(400).json({
          success: false,
          message: 'Section name already exists'
        });
      }

      const bannerData = {
        section_name: section_name.trim(),
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        description: description ? description.trim() : null,
        image: image || null,
        button_text: button_text ? button_text.trim() : null,
        button_link: button_link ? button_link.trim() : null,
        display_order: parseInt(display_order) || 0,
        is_active: is_active === true || is_active === 'true'
      };

      const banner = await Banner.create(bannerData);

      res.status(201).json({
        success: true,
        message: 'Banner created successfully',
        data: banner
      });
    } catch (error) {
      console.error('Create banner error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating banner'
      });
    }
  }

  // Update banner (admin)
  static async updateBanner(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid banner ID is required'
        });
      }

      const {
        section_name,
        title,
        subtitle,
        description,
        image,
        button_text,
        button_link,
        display_order,
        is_active
      } = req.body;

      // Check if banner exists
      const existingBanner = await Banner.findById(parseInt(id));
      if (!existingBanner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        });
      }

      // Check if section name is being changed and already exists
      if (section_name && section_name !== existingBanner.section_name) {
        const bannerWithSameSection = await Banner.findBySection(section_name);
        if (bannerWithSameSection && bannerWithSameSection.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: 'Section name already exists'
          });
        }
      }

      const updateData = {
        section_name: section_name ? section_name.trim() : undefined,
        title: title ? title.trim() : undefined,
        subtitle: subtitle !== undefined ? (subtitle ? subtitle.trim() : null) : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        image: image !== undefined ? image : undefined,
        button_text: button_text !== undefined ? (button_text ? button_text.trim() : null) : undefined,
        button_link: button_link !== undefined ? (button_link ? button_link.trim() : null) : undefined,
        display_order: display_order !== undefined ? parseInt(display_order) : undefined,
        is_active: is_active !== undefined ? (is_active === true || is_active === 'true') : undefined
      };

      // Filter out undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedBanner = await Banner.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Banner updated successfully',
        data: updatedBanner
      });
    } catch (error) {
      console.error('Update banner error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating banner'
      });
    }
  }

  // Delete banner (admin)
  static async deleteBanner(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid banner ID is required'
        });
      }

      // Check if banner exists
      const existingBanner = await Banner.findById(parseInt(id));
      if (!existingBanner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        });
      }

      await Banner.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Banner deleted successfully'
      });
    } catch (error) {
      console.error('Delete banner error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting banner'
      });
    }
  }

  // Toggle banner active status (admin)
  static async toggleActiveStatus(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid banner ID is required'
        });
      }

      const newStatus = await Banner.toggleActive(parseInt(id));

      res.json({
        success: true,
        message: `Banner ${newStatus ? 'activated' : 'deactivated'} successfully`,
        data: { is_active: newStatus }
      });
    } catch (error) {
      console.error('Toggle active status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while toggling banner status'
      });
    }
  }

  // Update banner display order (admin - bulk update)
  static async updateDisplayOrder(req, res) {
    try {
      const { banners } = req.body; // Array of {id: 1, display_order: 0}
      
      if (!Array.isArray(banners)) {
        return res.status(400).json({
          success: false,
          message: 'Banners array is required'
        });
      }

      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();

        for (const banner of banners) {
          if (banner.id && banner.display_order !== undefined) {
            await connection.execute(
              'UPDATE banners SET display_order = ? WHERE id = ?',
              [banner.display_order, banner.id]
            );
          }
        }

        await connection.commit();
        
        res.json({
          success: true,
          message: 'Display order updated successfully'
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Update display order error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating display order'
      });
    }
  }

  // Get banner statistics (admin)
  static async getStatistics(req, res) {
    try {
      const [result] = await pool.execute(`
        SELECT 
          COUNT(*) as total_banners,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_banners,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_banners,
          section_name,
          COUNT(*) as section_count
        FROM banners 
        GROUP BY section_name
        ORDER BY section_name
      `);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get banner statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching statistics'
      });
    }
  }
}

module.exports = BannerController;
