const pool = require('../config/database');

class Service {
  // Get all services
  static async findAll(showInactive = false) {
    let query = 'SELECT * FROM services';
    const params = [];
    
    if (!showInactive) {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY display_order, created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get service by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Get service by slug
  static async findBySlug(slug) {
    const [rows] = await pool.execute(
      'SELECT * FROM services WHERE slug = ? AND is_active = true',
      [slug]
    );
    return rows[0];
  }

  // Create service
  static async create(data) {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => data[key]);
    
    const [result] = await pool.execute(
      `INSERT INTO services (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    return this.findById(result.insertId);
  }

  // Update service
  static async update(id, data) {
    const fields = [];
    const values = [];
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });
    
    values.push(id);
    
    await pool.execute(
      `UPDATE services SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }

  // Delete service
  static async delete(id) {
    await pool.execute('DELETE FROM services WHERE id = ?', [id]);
  }

  // Toggle active status
  static async toggleStatus(id) {
    const service = await this.findById(id);
    const newStatus = !service.is_active;
    
    await pool.execute(
      'UPDATE services SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, id]
    );
    
    return newStatus;
  }
}

module.exports = Service;
