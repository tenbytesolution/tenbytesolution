const CompanyProfile = require('../models/CompanyProfile');

class CompanyController {
  // Get company profile
  static async getProfile(req, res) {
    try {
      const profile = await CompanyProfile.get();
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Company profile not found'
        });
      }

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Get company profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update company profile
  static async updateProfile(req, res) {
    try {
      const {
        company_name,
        tagline,
        description,
        vision,
        mission,
        address,
        phone,
        email,
        whatsapp,
        logo,
        hero_image,
        about_image,
        social_facebook,
        social_instagram,
        social_linkedin,
        social_twitter
      } = req.body;

      const updateData = {
        company_name,
        tagline,
        description,
        vision,
        mission,
        address,
        phone,
        email,
        whatsapp,
        logo,
        hero_image,
        about_image,
        social_facebook,
        social_instagram,
        social_linkedin,
        social_twitter
      };

      // Filter out undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedProfile = await CompanyProfile.update(updateData);

      res.json({
        success: true,
        message: 'Company profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Update company profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Upload logo
  static async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const logoPath = `/uploads/images/${req.file.filename}`;
      
      // Update company profile with new logo
      const updatedProfile = await CompanyProfile.update({ logo: logoPath });

      res.json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          logo: logoPath,
          profile: updatedProfile
        }
      });
    } catch (error) {
      console.error('Upload logo error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Upload hero image
  static async uploadHeroImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const imagePath = `/uploads/images/${req.file.filename}`;
      
      // Update company profile with new hero image
      const updatedProfile = await CompanyProfile.update({ hero_image: imagePath });

      res.json({
        success: true,
        message: 'Hero image uploaded successfully',
        data: {
          hero_image: imagePath,
          profile: updatedProfile
        }
      });
    } catch (error) {
      console.error('Upload hero image error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = CompanyController;
