const pool = require('../config/database');

class User {
  // Find user by email
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = true',
      [email]
    );
    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ? AND is_active = true',
      [id]
    );
    return rows[0];
  }

  // Create new user
  static async create(userData) {
    const { name, email, password, role = 'editor' } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
    return this.findById(result.insertId);
  }

  // Update user
  static async update(id, userData) {
    const fields = [];
    const values = [];
    
    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(userData[key]);
      }
    });
    
    values.push(id);
    
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }

  // Update last login
  static async updateLastLogin(id) {
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
  }

  // Get all users (admin only)
  static async findAll() {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  // Delete user (soft delete)
  static async delete(id) {
    await pool.execute(
      'UPDATE users SET is_active = false WHERE id = ?',
      [id]
    );
  }
}

module.exports = User;
