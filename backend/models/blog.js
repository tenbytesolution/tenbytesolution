const pool = require('../config/database');

class Blog {
  // Get all blogs
  static async findAll(publishedOnly = true, limit = 10, page = 1) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT b.*, u.name as author_name 
      FROM blogs b 
      LEFT JOIN users u ON b.author_id = u.id
    `;
    const params = [];
    
    if (publishedOnly) {
      query += ' WHERE b.is_published = true';
    }
    
    query += ' ORDER BY b.published_at DESC, b.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM blogs';
    const countParams = [];
    
    if (publishedOnly) {
      countQuery += ' WHERE is_published = true';
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    
    return {
      data: rows,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // Get blog by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT b.*, u.name as author_name 
       FROM blogs b 
       LEFT JOIN users u ON b.author_id = u.id 
       WHERE b.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Get blog by slug
  static async findBySlug(slug) {
    const [rows] = await pool.execute(
      `SELECT b.*, u.name as author_name 
       FROM blogs b 
       LEFT JOIN users u ON b.author_id = u.id 
       WHERE b.slug = ? AND b.is_published = true`,
      [slug]
    );
    return rows[0];
  }

  // Create blog
  static async create(data) {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => {
      if (key === 'tags') {
        return JSON.stringify(data[key]);
      }
      return data[key];
    });
    
    const [result] = await pool.execute(
      `INSERT INTO blogs (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    // Increment view count
    await this.incrementViewCount(result.insertId);
    
    return this.findById(result.insertId);
  }

  // Update blog
  static async update(id, data) {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'tags') {
          values.push(JSON.stringify(data[key]));
        } else {
          values.push(data[key]);
        }
      }
    });
    
    values.push(id);
    
    await pool.execute(
      `UPDATE blogs SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }

  // Delete blog
  static async delete(id) {
    await pool.execute('DELETE FROM blogs WHERE id = ?', [id]);
  }

  // Increment view count
  static async incrementViewCount(id) {
    await pool.execute(
      'UPDATE blogs SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );
  }

  // Toggle publish status
  static async togglePublish(id) {
    const blog = await this.findById(id);
    const newStatus = !blog.is_published;
    
    await pool.execute(
      'UPDATE blogs SET is_published = ?, published_at = ? WHERE id = ?',
      [newStatus, newStatus ? new Date() : null, id]
    );
    
    return newStatus;
  }

  // Get blog statistics
  static async getStatistics() {
    const [result] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) as published,
        SUM(view_count) as total_views,
        DATE(created_at) as date,
        COUNT(*) as daily_posts
      FROM blogs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    return result;
  }
}

module.exports = Blog;
