const Testimonial = require('../models/Testimonial');
const pool = require('../config/database');

class TestimonialController {
  // Get all approved testimonials (public)
  static async getAllTestimonials(req, res) {
    try {
      const { limit, featured } = req.query;
      
      let query = 'SELECT * FROM testimonials WHERE is_approved = 1';
      const params = [];
      
      if (featured === 'true') {
        query += ' ORDER BY rating DESC, display_order';
      } else {
        query += ' ORDER BY display_order, created_at DESC';
      }
      
      if (limit && !isNaN(parseInt(limit))) {
        query += ' LIMIT ?';
        params.push(parseInt(limit));
      }
      
      const [rows] = await pool.execute(query, params);
      
      res.json({
        success: true,
        count: rows.length,
        data: rows
      });
    } catch (error) {
      console.error('Get testimonials error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching testimonials'
      });
    }
  }

  // Get testimonials statistics (public)
  static async getTestimonialsStats(req, res) {
    try {
      const [result] = await pool.execute(`
        SELECT 
          COUNT(*) as total_testimonials,
          AVG(rating) as average_rating,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM testimonials 
        WHERE is_approved = 1
      `);
      
      res.json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      console.error('Get testimonials stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching testimonials statistics'
      });
    }
  }

  // Get all testimonials (admin - includes unapproved)
  static async adminGetAllTestimonials(req, res) {
    try {
      const { 
        approvedOnly = 'false',
        limit = 20, 
        page = 1,
        search 
      } = req.query;

      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);
      
      let query = 'SELECT * FROM testimonials';
      const params = [];
      
      if (approvedOnly === 'true') {
        query += ' WHERE is_approved = 1';
      }
      
      if (search) {
        const whereClause = approvedOnly === 'true' ? ' AND' : ' WHERE';
        query += `${whereClause} (client_name LIKE ? OR position_company LIKE ? OR message LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parsedLimit, (parsedPage - 1) * parsedLimit);
      
      const [rows] = await pool.execute(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM testimonials';
      const countParams = [];
      
      if (approvedOnly === 'true') {
        countQuery += ' WHERE is_approved = 1';
      }
      
      if (search) {
        const whereClause = approvedOnly === 'true' ? ' AND' : ' WHERE';
        countQuery += `${whereClause} (client_name LIKE ? OR position_company LIKE ? OR message LIKE ?)`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      res.json({
        success: true,
        data: rows,
        pagination: {
          total,
          page: parsedPage,
          totalPages: Math.ceil(total / parsedLimit),
          limit: parsedLimit
        }
      });
    } catch (error) {
      console.error('Admin get testimonials error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching testimonials'
      });
    }
  }

  // Get testimonial by ID (admin)
  static async adminGetTestimonialById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid testimonial ID is required'
        });
      }

      const testimonial = await Testimonial.findById(parseInt(id));
      
      if (!testimonial) {
        return res.status(404).json({
          success: false,
          message: 'Testimonial not found'
        });
      }

      res.json({
        success: true,
        data: testimonial
      });
    } catch (error) {
      console.error('Admin get testimonial error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching testimonial'
      });
    }
  }

  // Create testimonial (admin & public)
  static async createTestimonial(req, res) {
    try {
      const {
        client_name,
        position_company,
        message,
        rating = 5,
        image
      } = req.body;

      // Validation
      if (!client_name || !client_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Client name is required'
        });
      }

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Testimonial message is required'
        });
      }

      // Validate rating
      const parsedRating = parseInt(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Check if user is admin to auto-approve
      const isAdmin = req.user && req.user.role === 'admin';
      
      const testimonialData = {
        client_name: client_name.trim(),
        position_company: position_company ? position_company.trim() : null,
        message: message.trim(),
        rating: parsedRating,
        image: image || null,
        is_approved: isAdmin, // Auto-approve if admin
        display_order: 0
      };

      const testimonial = await Testimonial.create(testimonialData);

      res.status(201).json({
        success: true,
        message: isAdmin ? 'Testimonial created and approved' : 'Testimonial submitted for review',
        data: testimonial
      });
    } catch (error) {
      console.error('Create testimonial error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating testimonial'
      });
    }
  }

  // Update testimonial (admin)
  static async updateTestimonial(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid testimonial ID is required'
        });
      }

      const {
        client_name,
        position_company,
        message,
        rating,
        image,
        display_order,
        is_approved
      } = req.body;

      // Check if testimonial exists
      const existingTestimonial = await Testimonial.findById(parseInt(id));
      if (!existingTestimonial) {
        return res.status(404).json({
          success: false,
          message: 'Testimonial not found'
        });
      }

      const updateData = {
        client_name: client_name ? client_name.trim() : undefined,
        position_company: position_company !== undefined ? (position_company ? position_company.trim() : null) : undefined,
        message: message ? message.trim() : undefined,
        rating: rating !== undefined ? parseInt(rating) : undefined,
        image: image !== undefined ? image : undefined,
        display_order: display_order !== undefined ? parseInt(display_order) : undefined,
        is_approved: is_approved !== undefined ? (is_approved === true || is_approved === 'true') : undefined
      };

      // Validate rating if being updated
      if (updateData.rating !== undefined && (updateData.rating < 1 || updateData.rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Filter out undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedTestimonial = await Testimonial.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Testimonial updated successfully',
        data: updatedTestimonial
      });
    } catch (error) {
      console.error('Update testimonial error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating testimonial'
      });
    }
  }

  // Delete testimonial (admin)
  static async deleteTestimonial(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid testimonial ID is required'
        });
      }

      // Check if testimonial exists
      const existingTestimonial = await Testimonial.findById(parseInt(id));
      if (!existingTestimonial) {
        return res.status(404).json({
          success: false,
          message: 'Testimonial not found'
        });
      }

      await Testimonial.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Testimonial deleted successfully'
      });
    } catch (error) {
      console.error('Delete testimonial error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting testimonial'
      });
    }
  }

  // Toggle approval status (admin)
  static async toggleApprovalStatus(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid testimonial ID is required'
        });
      }

      const newStatus = await Testimonial.toggleApproval(parseInt(id));

      res.json({
        success: true,
        message: `Testimonial ${newStatus ? 'approved' : 'unapproved'} successfully`,
        data: { is_approved: newStatus }
      });
    } catch (error) {
      console.error('Toggle approval status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while toggling approval status'
      });
    }
  }

  // Bulk update display order (admin)
  static async updateDisplayOrder(req, res) {
    try {
      const { testimonials } = req.body; // Array of {id: 1, display_order: 0}
      
      if (!Array.isArray(testimonials)) {
        return res.status(400).json({
          success: false,
          message: 'Testimonials array is required'
        });
      }

      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();

        for (const testimonial of testimonials) {
          if (testimonial.id && testimonial.display_order !== undefined) {
            await connection.execute(
              'UPDATE testimonials SET display_order = ? WHERE id = ?',
              [testimonial.display_order, testimonial.id]
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

  // Get testimonials statistics (admin)
  static async getStatistics(req, res) {
    try {
      const [result] = await pool.execute(`
        SELECT 
          COUNT(*) as total_testimonials,
          SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved_testimonials,
          SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending_testimonials,
          AVG(rating) as average_rating,
          DATE(created_at) as date,
          COUNT(*) as daily_testimonials
        FROM testimonials 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      
      // Get top rated testimonials
      const [topRated] = await pool.execute(`
        SELECT id, client_name, rating, message, created_at
        FROM testimonials 
        WHERE is_approved = 1
        ORDER BY rating DESC, created_at DESC
        LIMIT 5
      `);
      
      res.json({
        success: true,
        data: {
          summary: result,
          top_rated: topRated
        }
      });
    } catch (error) {
      console.error('Get testimonial statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching statistics'
      });
    }
  }

  // Submit testimonial from public form (no authentication required)
  static async submitPublicTestimonial(req, res) {
    try {
      const {
        client_name,
        position_company,
        message,
        rating = 5,
        email,
        phone
      } = req.body;

      // Validation
      if (!client_name || !client_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Nama lengkap diperlukan'
        });
      }

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Testimoni tidak boleh kosong'
        });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email diperlukan'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format email tidak valid'
        });
      }

      // Validate rating
      const parsedRating = parseInt(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating harus antara 1-5'
        });
      }

      // Create testimonial (pending approval)
      const testimonialData = {
        client_name: client_name.trim(),
        position_company: position_company ? position_company.trim() : null,
        message: message.trim(),
        rating: parsedRating,
        is_approved: false, // Always pending for public submissions
        display_order: 0
      };

      const testimonial = await Testimonial.create(testimonialData);

      // Store contact info separately (optional)
      if (email || phone) {
        await pool.execute(
          'INSERT INTO testimonial_contacts (testimonial_id, email, phone) VALUES (?, ?, ?)',
          [testimonial.id, email, phone]
        );
      }

      res.status(201).json({
        success: true,
        message: 'Testimoni berhasil dikirim. Terima kasih! Testimoni Anda akan direview oleh admin.',
        data: {
          id: testimonial.id,
          client_name: testimonial.client_name,
          submitted_at: testimonial.created_at
        }
      });
    } catch (error) {
      console.error('Submit public testimonial error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengirim testimoni'
      });
    }
  }
}

module.exports = TestimonialController;