const pool = require('../config/database');

class Banner {
  // Get all banners
  static async findAll(activeOnly = true) {
    let query = 'SELECT * FROM banners';
    const params = [];
    
    if (activeOnly) {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY display_order, section_name';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get banner by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM banners WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Get banner by section name
  static async findBySection(sectionName) {
    const [rows] = await pool.execute(
      'SELECT * FROM banners WHERE section_name = ? AND is_active = true',
      [sectionName]
    );
    return rows[0];
  }

  // Create banner
  static async create(data) {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => data[key]);
    
    const [result] = await pool.execute(
      `INSERT INTO banners (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    return this.findById(result.insertId);
  }

  // Update banner
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
      `UPDATE banners SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }

  // Delete banner
  static async delete(id) {
    await pool.execute('DELETE FROM banners WHERE id = ?', [id]);
  }

  // Toggle active status
  static async toggleActive(id) {
    const banner = await this.findById(id);
    const newStatus = !banner.is_active;
    
    await pool.execute(
      'UPDATE banners SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, id]
    );
    
    return newStatus;
  }
}

module.exports = Banner;
