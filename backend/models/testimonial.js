const pool = require('../config/database');

class Testimonial {
  // Get all testimonials
  static async findAll(showUnapproved = false) {
    let query = 'SELECT * FROM testimonials';
    const params = [];
    
    if (!showUnapproved) {
      query += ' WHERE is_approved = true';
    }
    
    query += ' ORDER BY display_order, rating DESC, created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  // Get testimonial by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM testimonials WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Create testimonial
  static async create(data) {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => data[key]);
    
    const [result] = await pool.execute(
      `INSERT INTO testimonials (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    return this.findById(result.insertId);
  }

  // Update testimonial
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
      `UPDATE testimonials SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }

  // Delete testimonial
  static async delete(id) {
    await pool.execute('DELETE FROM testimonials WHERE id = ?', [id]);
  }

  // Toggle approval status
  static async toggleApproval(id) {
    const testimonial = await this.findById(id);
    const newStatus = !testimonial.is_approved;
    
    await pool.execute(
      'UPDATE testimonials SET is_approved = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, id]
    );
    
    return newStatus;
  }
}

module.exports = Testimonial;
