const Blog = require('../models/Blog');
const slugify = require('slugify');
const pool = require('../config/database');

class BlogController {
  // Get all published blogs (public)
  static async getAllBlogs(req, res) {
    try {
      const { 
        limit = 10, 
        page = 1, 
        category,
        search,
        sort = 'newest' 
      } = req.query;

      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);
      
      let query = `
        SELECT b.*, u.name as author_name 
        FROM blogs b 
        LEFT JOIN users u ON b.author_id = u.id
        WHERE b.is_published = 1
      `;
      
      const params = [];
      
      // Filter by category/tags
      if (category) {
        query += ' AND JSON_CONTAINS(b.tags, ?)';
        params.push(JSON.stringify([category]));
      }
      
      // Search functionality
      if (search) {
        query += ' AND (b.title LIKE ? OR b.excerpt LIKE ? OR b.content LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Sorting
      switch (sort) {
        case 'oldest':
          query += ' ORDER BY b.published_at ASC';
          break;
        case 'popular':
          query += ' ORDER BY b.view_count DESC';
          break;
        case 'newest':
        default:
          query += ' ORDER BY b.published_at DESC';
      }
      
      // Pagination
      const offset = (parsedPage - 1) * parsedLimit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parsedLimit, offset);
      
      const [rows] = await pool.execute(query, params);
      
      // Parse JSON fields
      const blogs = rows.map(blog => {
        if (blog.tags) {
          try {
            blog.tags = JSON.parse(blog.tags);
          } catch (e) {
            blog.tags = [];
          }
        }
        return blog;
      });
      
      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM blogs 
        WHERE is_published = 1
      `;
      const countParams = [];
      
      if (category) {
        countQuery += ' AND JSON_CONTAINS(tags, ?)';
        countParams.push(JSON.stringify([category]));
      }
      
      if (search) {
        countQuery += ' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)';
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      res.json({
        success: true,
        data: blogs,
        pagination: {
          total,
          page: parsedPage,
          totalPages: Math.ceil(total / parsedLimit),
          limit: parsedLimit
        }
      });
    } catch (error) {
      console.error('Get blogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching blogs'
      });
    }
  }

  // Get blog by slug (public)
  static async getBlogBySlug(req, res) {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        return res.status(400).json({
          success: false,
          message: 'Blog slug is required'
        });
      }

      const blog = await Blog.findBySlug(slug);
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Parse tags JSON
      if (blog.tags) {
        try {
          blog.tags = JSON.parse(blog.tags);
        } catch (e) {
          blog.tags = [];
        }
      }

      // Increment view count
      await Blog.incrementViewCount(blog.id);

      // Get related blogs
      const relatedBlogs = await this.getRelatedBlogs(blog);

      res.json({
        success: true,
        data: {
          ...blog,
          related_blogs: relatedBlogs
        }
      });
    } catch (error) {
      console.error('Get blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching blog'
      });
    }
  }

  // Get related blogs
  static async getRelatedBlogs(blog, limit = 3) {
    try {
      let query = `
        SELECT id, title, slug, excerpt, thumbnail, published_at, view_count
        FROM blogs 
        WHERE is_published = 1 AND id != ?
      `;
      
      const params = [blog.id];
      
      // If blog has tags, use them to find related blogs
      if (blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0) {
        const tagConditions = blog.tags.map(tag => {
          query += ' AND JSON_CONTAINS(tags, ?)';
          params.push(JSON.stringify([tag]));
        });
      }
      
      query += ' ORDER BY published_at DESC LIMIT ?';
      params.push(limit);
      
      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Get related blogs error:', error);
      return [];
    }
  }

  // Get all blogs (admin - includes unpublished)
  static async adminGetAllBlogs(req, res) {
    try {
      const { 
        publishedOnly = 'false',
        limit = 10, 
        page = 1,
        search 
      } = req.query;

      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);
      
      let query = `
        SELECT b.*, u.name as author_name 
        FROM blogs b 
        LEFT JOIN users u ON b.author_id = u.id
      `;
      
      const params = [];
      
      if (publishedOnly === 'true') {
        query += ' WHERE b.is_published = 1';
      }
      
      if (search) {
        const whereClause = publishedOnly === 'true' ? ' AND' : ' WHERE';
        query += `${whereClause} (b.title LIKE ? OR b.excerpt LIKE ? OR u.name LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
      params.push(parsedLimit, (parsedPage - 1) * parsedLimit);
      
      const [rows] = await pool.execute(query, params);
      
      // Parse JSON fields
      const blogs = rows.map(blog => {
        if (blog.tags) {
          try {
            blog.tags = JSON.parse(blog.tags);
          } catch (e) {
            blog.tags = [];
          }
        }
        return blog;
      });
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM blogs';
      const countParams = [];
      
      if (publishedOnly === 'true') {
        countQuery += ' WHERE is_published = 1';
      }
      
      if (search) {
        const whereClause = publishedOnly === 'true' ? ' AND' : ' WHERE';
        countQuery += `${whereClause} (title LIKE ? OR excerpt LIKE ?)`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      res.json({
        success: true,
        data: blogs,
        pagination: {
          total,
          page: parsedPage,
          totalPages: Math.ceil(total / parsedLimit),
          limit: parsedLimit
        }
      });
    } catch (error) {
      console.error('Admin get blogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching blogs'
      });
    }
  }

  // Get blog by ID (admin)
  static async adminGetBlogById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid blog ID is required'
        });
      }

      const blog = await Blog.findById(parseInt(id));
      
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Parse tags JSON
      if (blog.tags) {
        try {
          blog.tags = JSON.parse(blog.tags);
        } catch (e) {
          blog.tags = [];
        }
      }

      res.json({
        success: true,
        data: blog
      });
    } catch (error) {
      console.error('Admin get blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching blog'
      });
    }
  }

  // Create blog (admin)
  static async createBlog(req, res) {
    try {
      const {
        title,
        excerpt,
        content,
        thumbnail,
        tags,
        meta_title,
        meta_description,
        meta_keywords,
        is_published = false
      } = req.body;

      // Validation
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }

      // Generate slug
      let slug = slugify(title, { 
        lower: true,
        strict: true,
        locale: 'id'
      });

      // Check if slug already exists
      let slugExists = true;
      let slugCounter = 1;
      let finalSlug = slug;
      
      while (slugExists) {
        const [existing] = await pool.execute(
          'SELECT id FROM blogs WHERE slug = ?',
          [finalSlug]
        );
        
        if (existing.length === 0) {
          slugExists = false;
        } else {
          finalSlug = `${slug}-${slugCounter}`;
          slugCounter++;
        }
      }

      // Parse tags
      let parsedTags = [];
      if (tags) {
        try {
          if (typeof tags === 'string') {
            parsedTags = JSON.parse(tags);
          } else if (Array.isArray(tags)) {
            parsedTags = tags;
          }
        } catch (e) {
          parsedTags = [];
        }
      }

      const blogData = {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt ? excerpt.trim() : content.substring(0, 200) + '...',
        content: content.trim(),
        thumbnail: thumbnail || null,
        tags: parsedTags.length > 0 ? JSON.stringify(parsedTags) : null,
        author_id: req.user.id,
        meta_title: meta_title ? meta_title.trim() : title.trim(),
        meta_description: meta_description ? meta_description.trim() : (excerpt ? excerpt.trim() : content.substring(0, 160)),
        meta_keywords: meta_keywords ? meta_keywords.trim() : null,
        is_published: is_published === true || is_published === 'true',
        published_at: (is_published === true || is_published === 'true') ? new Date() : null
      };

      const blog = await Blog.create(blogData);

      res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        data: blog
      });
    } catch (error) {
      console.error('Create blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating blog'
      });
    }
  }

  // Update blog (admin)
  static async updateBlog(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid blog ID is required'
        });
      }

      const {
        title,
        excerpt,
        content,
        thumbnail,
        tags,
        meta_title,
        meta_description,
        meta_keywords,
        is_published
      } = req.body;

      // Check if blog exists
      const existingBlog = await Blog.findById(parseInt(id));
      if (!existingBlog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      const updateData = {
        title: title ? title.trim() : undefined,
        excerpt: excerpt !== undefined ? (excerpt ? excerpt.trim() : null) : undefined,
        content: content ? content.trim() : undefined,
        thumbnail: thumbnail !== undefined ? thumbnail : undefined,
        meta_title: meta_title !== undefined ? (meta_title ? meta_title.trim() : null) : undefined,
        meta_description: meta_description !== undefined ? (meta_description ? meta_description.trim() : null) : undefined,
        meta_keywords: meta_keywords !== undefined ? (meta_keywords ? meta_keywords.trim() : null) : undefined,
        is_published: is_published !== undefined ? (is_published === true || is_published === 'true') : undefined
      };

      // Parse tags if provided
      if (tags !== undefined) {
        let parsedTags = [];
        try {
          if (typeof tags === 'string') {
            parsedTags = JSON.parse(tags);
          } else if (Array.isArray(tags)) {
            parsedTags = tags;
          }
        } catch (e) {
          parsedTags = [];
        }
        updateData.tags = parsedTags.length > 0 ? JSON.stringify(parsedTags) : null;
      }

      // If title changed, update slug
      if (title && title !== existingBlog.title) {
        let slug = slugify(title, { 
          lower: true,
          strict: true,
          locale: 'id'
        });

        // Check if new slug already exists
        let slugExists = true;
        let slugCounter = 1;
        let finalSlug = slug;
        
        while (slugExists) {
          const [existing] = await pool.execute(
            'SELECT id FROM blogs WHERE slug = ? AND id != ?',
            [finalSlug, id]
          );
          
          if (existing.length === 0) {
            slugExists = false;
          } else {
            finalSlug = `${slug}-${slugCounter}`;
            slugCounter++;
          }
        }
        
        updateData.slug = finalSlug;
      }

      // Update published_at if publishing
      if (is_published === 'true' && !existingBlog.is_published) {
        updateData.published_at = new Date();
      } else if (is_published === 'false' && existingBlog.is_published) {
        updateData.published_at = null;
      }

      // Filter out undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedBlog = await Blog.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: 'Blog updated successfully',
        data: updatedBlog
      });
    } catch (error) {
      console.error('Update blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating blog'
      });
    }
  }

  // Delete blog (admin)
  static async deleteBlog(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid blog ID is required'
        });
      }

      // Check if blog exists
      const existingBlog = await Blog.findById(parseInt(id));
      if (!existingBlog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      await Blog.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (error) {
      console.error('Delete blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting blog'
      });
    }
  }

  // Toggle publish status (admin)
  static async togglePublishStatus(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid blog ID is required'
        });
      }

      const newStatus = await Blog.togglePublish(parseInt(id));

      res.json({
        success: true,
        message: `Blog ${newStatus ? 'published' : 'unpublished'} successfully`,
        data: { is_published: newStatus }
      });
    } catch (error) {
      console.error('Toggle publish status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while toggling publish status'
      });
    }
  }

  // Get blog statistics (admin)
  static async getStatistics(req, res) {
    try {
      const [result] = await pool.execute(`
        SELECT 
          COUNT(*) as total_blogs,
          SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_blogs,
          SUM(view_count) as total_views,
          DATE(created_at) as date,
          COUNT(*) as daily_posts
        FROM blogs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      
      // Get top 5 most viewed blogs
      const [topBlogs] = await pool.execute(`
        SELECT id, title, slug, view_count
        FROM blogs 
        WHERE is_published = 1
        ORDER BY view_count DESC
        LIMIT 5
      `);
      
      // Get tags statistics
      const [tagsResult] = await pool.execute(`
        SELECT 
          tag,
          COUNT(*) as count
        FROM (
          SELECT JSON_UNQUOTE(JSON_EXTRACT(tags, CONCAT('$[', numbers.n, ']'))) as tag
          FROM blogs
          CROSS JOIN (
            SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
          ) numbers
          WHERE JSON_LENGTH(tags) > numbers.n AND is_published = 1
        ) as tags_table
        WHERE tag IS NOT NULL
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 10
      `);
      
      res.json({
        success: true,
        data: {
          summary: result,
          top_blogs: topBlogs,
          popular_tags: tagsResult
        }
      });
    } catch (error) {
      console.error('Get blog statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching statistics'
      });
    }
  }

  // Get blog categories/tags (public)
  static async getCategories(req, res) {
    try {
      const [result] = await pool.execute(`
        SELECT 
          tag,
          COUNT(*) as count
        FROM (
          SELECT JSON_UNQUOTE(JSON_EXTRACT(tags, CONCAT('$[', numbers.n, ']'))) as tag
          FROM blogs
          CROSS JOIN (
            SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
          ) numbers
          WHERE JSON_LENGTH(tags) > numbers.n AND is_published = 1
        ) as tags_table
        WHERE tag IS NOT NULL
        GROUP BY tag
        ORDER BY count DESC
      `);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching categories'
      });
    }
  }
}

module.exports = BlogController;
