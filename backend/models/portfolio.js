const pool = require('../config/database');

class Portfolio {
  // Get all portfolios
  static async findAll(showAll = false, limit = null) {
    let query = 'SELECT * FROM portfolios';
    const params = [];
    
    if (!showAll) {
      query += ' WHERE is_featured = true';
    }
    
    query += ' ORDER BY completion_date DESC, created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get portfolio by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM portfolios WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Get portfolio by slug
  static async findBySlug(slug) {
    const [rows] = await pool.execute(
      'SELECT * FROM portfolios WHERE slug = ?',
      [slug]
    );
    return rows[0];
  }

  // Create portfolio
  static async create(data) {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => {
      if (key === 'tech_stack' || key === 'images') {
        return JSON.stringify(data[key]);
      }
      return data[key];
    });
    
    const [result] = await pool.execute(
      `INSERT INTO portfolios (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    return this.findById(result.insertId);
  }

  // Update portfolio
  static async update(id, data) {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === 'tech_stack' || key === 'images') {
          values.push(JSON.stringify(data[key]));
        } else {
          values.push(data[key]);
        }
      }
    });
    
    values.push(id);
    
    await pool.execute(
      `UPDATE portfolios SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }

  // Delete portfolio
  static async delete(id) {
    await pool.execute('DELETE FROM portfolios WHERE id = ?', [id]);
  }

  // Toggle featured status
  static async toggleFeatured(id) {
    const portfolio = await this.findById(id);
    const newStatus = !portfolio.is_featured;
    
    await pool.execute(
      'UPDATE portfolios SET is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, id]
    );
    
    return newStatus;
  }

  // Get portfolio statistics
  static async getStatistics() {
    const [result] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_featured = true THEN 1 ELSE 0 END) as featured,
        project_type,
        COUNT(*) as type_count
      FROM portfolios 
      GROUP BY project_type
    `);
    
    return result;
  }
}

module.exports = Portfolio;
