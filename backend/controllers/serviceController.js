const Service = require('../models/Service');
const slugify = require('slugify');

class ServiceController {
  // Get all services (public)
  static async getAllServices(req, res) {
    try {
      const services = await Service.findAll();
      
      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get service by slug (public)
  static async getServiceBySlug(req, res) {
    try {
      const { slug } = req.params;
      const service = await Service.findBySlug(slug);
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.json({
        success: true,
        data: service
      });
    } catch (error) {
      console.error('Get service error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get all services (admin)
  static async adminGetAllServices(req, res) {
    try {
      const { showInactive } = req.query;
      const services = await Service.findAll(showInactive === 'true');
      
      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      console.error('Admin get services error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get service by ID (admin)
  static async adminGetServiceById(req, res) {
    try {
      const { id } = req.params;
      const service = await Service.findById(id);
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.json({
        success: true,
        data: service
      });
    } catch (error) {
      console.error('Admin get service error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Create service (admin)
  static async createService(req, res) {
    try {
      const {
        service_name,
        short_description,
        long_description,
        icon_image,
        cover_image,
        feature_list,
        price_start_from,
        display_order
      } = req.body;

      // Generate slug
      const slug = slugify(service_name, { 
        lower: true,
        strict: true,
        locale: 'id'
      });

      const serviceData = {
        service_name,
        slug,
        short_description,
        long_description,
        icon_image,
        cover_image,
        feature_list: feature_list ? JSON.parse(feature_list) : null,
        price_start_from,
        display_order: display_order || 0
      };

      const service = await Service.create(serviceData);

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: service
      });
    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update service (admin)
  static async updateService(req, res) {
    try {
      const { id } = req.params;
      const {
        service_name,
        short_description,
        long_description,
        icon_image,
        cover_image,
        feature_list,
        price_start_from,
        display_order,
        is_active
      } = req.body;

      const updateData = {
        service_name,
        short_description,
        long_description,
        icon_image,
        cover_image,
        feature_list: feature_list ? JSON.parse(feature_list) : undefined,
        price_start_from,
        display_order,
        is_active
      };

      // If service name changed, update slug
      if (service_name) {
        const currentService = await Service.findById(id);
        if (currentService && currentService.service_name !== service_name) {
          updateData.slug = slugify(service_name, { 
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

      const updatedService = await Service.update(id, updateData);

      res.json({
        success: true,
        message: 'Service updated successfully',
        data: updatedService
      });
    } catch (error) {
      console.error('Update service error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete service (admin)
  static async deleteService(req, res) {
    try {
      const { id } = req.params;
      
      await Service.delete(id);

      res.json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      console.error('Delete service error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Toggle service status (admin)
  static async toggleServiceStatus(req, res) {
    try {
      const { id } = req.params;
      
      const newStatus = await Service.toggleStatus(id);

      res.json({
        success: true,
        message: `Service ${newStatus ? 'activated' : 'deactivated'} successfully`,
        data: { is_active: newStatus }
      });
    } catch (error) {
      console.error('Toggle service status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = ServiceController;
