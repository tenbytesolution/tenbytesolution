const pool = require('../config/database');

class ContactMessage {
  // Get all messages
  static async findAll(status = null, limit = 50, page = 1) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM contact_messages';
    const params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.execute(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM contact_messages';
    const countParams = [];
    
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    
    return {
      data: rows,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  // Get message by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM contact_messages WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  // Create message
  static async create(data) {
    const keys = Object.keys(data).filter(key => data[key] !== undefined);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(key => data[key]);
    
    const [result] = await pool.execute(
      `INSERT INTO contact_messages (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    return this.findById(result.insertId);
  }

  // Update message status
  static async updateStatus(id, status, response = null) {
    const updates = ['status = ?'];
    const values = [status];
    
    if (response) {
      updates.push('response = ?', 'responded_at = CURRENT_TIMESTAMP');
      values.push(response);
    } else if (status === 'replied') {
      updates.push('responded_at = CURRENT_TIMESTAMP');
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE contact_messages SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.findById(id);
  }

  // Delete message
  static async delete(id) {
    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);
  }

  // Get statistics
  static async getStatistics() {
    const [result] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_messages,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_messages,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_messages,
        DATE(created_at) as date,
        COUNT(*) as daily_count
      FROM contact_messages 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    return result;
  }
}

module.exports = ContactMessage;
