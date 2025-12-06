const pool = require('../config/database');

class CompanyProfile {
  // Get company profile
  static async get() {
    const [rows] = await pool.execute('SELECT * FROM company_profile LIMIT 1');
    return rows[0];
  }

  // Update company profile
  static async update(data) {
    const current = await this.get();
    
    if (current) {
      // Update existing
      const fields = [];
      const values = [];
      
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });
      
      await pool.execute(
        `UPDATE company_profile SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, current.id]
      );
    } else {
      // Insert new
      const keys = Object.keys(data).filter(key => data[key] !== undefined);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(key => data[key]);
      
      await pool.execute(
        `INSERT INTO company_profile (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }
    
    return this.get();
  }
}

module.exports = CompanyProfile;
