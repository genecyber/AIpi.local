const { Pool } = require('pg');
const DatabaseInterface = require('./idb.js');

class PostgresDatabase extends DatabaseInterface {
  /**
   * @param {string} connectionString 
   */
  constructor(connectionString) {
    super();
    this.pool = new Pool({ connectionString });
  }

  async initialize() {
    // Perform any necessary initialization
  }

  /**
   * @param {string} key 
   * @returns {Promise<string|null>}
   */
  async getBaseConfiguration(key) {
    const result = await this.pool.query(
      'SELECT config_value FROM base_configurations WHERE config_key = $1',
      [key]
    );
    return result.rows[0]?.config_value || null;
  }

  /**
   * @param {string} key 
   * @param {string} value 
   * @returns {Promise<void>}
   */
  async setBaseConfiguration(key, value) {
    await this.pool.query(
      'INSERT INTO base_configurations (config_key, config_value) VALUES ($1, $2) ' +
      'ON CONFLICT (config_key) DO UPDATE SET config_value = $2, updated_at = CURRENT_TIMESTAMP',
      [key, value]
    );
  }

  /**
   * @returns {Promise<import('./idb.js').BaseConfiguration[]>}
   */
  async getAllBaseConfigurations() {
    const result = await this.pool.query('SELECT * FROM base_configurations');
    return result.rows;
  }

  /**
   * @param {import('./idb.js').AddCustomEndpointInput} endpoint 
   * @returns {Promise<void>}
   */
  async addCustomEndpoint(endpoint) {
    await this.pool.query(
      'INSERT INTO custom_endpoints (path, method, model, prompt_template, strategy) VALUES ($1, $2, $3, $4, $5)',
      [endpoint.path, endpoint.method, endpoint.model, endpoint.prompt_template, endpoint.strategy]
    );
  }

  /**
   * @returns {Promise<import('./idb.js').CustomEndpoint[]>}
   */
  async fetchCustomEndpoints() {
    const result = await this.pool.query('SELECT * FROM custom_endpoints');
    return result.rows;
  }

  /**
   * @param {string} path 
   * @returns {Promise<import('./idb.js').CustomEndpoint|null>}
   */
  async getCustomEndpointByPath(path) {
    const result = await this.pool.query(
      'SELECT * FROM custom_endpoints WHERE path = $1',
      [path]
    );
    return result.rows[0] || null;
  }

  /**
   * @param {number} id 
   * @param {Partial<import('./idb.js').AddCustomEndpointInput>} endpoint 
   * @returns {Promise<void>}
   */
  async updateCustomEndpoint(id, endpoint) {
    const fields = Object.keys(endpoint);
    const values = Object.values(endpoint);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    await this.pool.query(
      `UPDATE custom_endpoints SET ${setClause} WHERE id = $1`,
      [id, ...values]
    );
  }

  /**
   * @param {number} id 
   * @returns {Promise<void>}
   */
  async deleteCustomEndpoint(id) {
    await this.pool.query('DELETE FROM custom_endpoints WHERE id = $1', [id]);
  }

  /**
   * @param {import('./idb.js').AddLogInput} log 
   * @returns {Promise<void>}
   */
  async addLog(log) {
    await this.pool.query(
      'INSERT INTO logs (prompt, response, model) VALUES ($1, $2, $3)',
      [log.prompt, log.response, log.model]
    );
  }

  /**
   * @param {number} [limit] 
   * @param {number} [offset] 
   * @returns {Promise<import('./idb.js').LogEntry[]>}
   */
  async fetchLogs(limit, offset) {
    let query = 'SELECT * FROM logs ORDER BY created_at DESC';
    const values = [];
    if (limit !== undefined) {
      query += ' LIMIT $1';
      values.push(limit);
    }
    if (offset !== undefined) {
      query += ' OFFSET $' + (values.length + 1);
      values.push(offset);
    }
    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * @param {string} model 
   * @param {number} [limit] 
   * @param {number} [offset] 
   * @returns {Promise<import('./idb.js').LogEntry[]>}
   */
  async fetchLogsByModel(model, limit, offset) {
    let query = 'SELECT * FROM logs WHERE model = $1 ORDER BY created_at DESC';
    const values = [model];
    if (limit !== undefined) {
      query += ' LIMIT $2';
      values.push(limit);
    }
    if (offset !== undefined) {
      query += ' OFFSET $' + (values.length + 1);
      values.push(offset);
    }
    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * @returns {Promise<number>}
   */
  async getLogCount() {
    const result = await this.pool.query('SELECT COUNT(*) as count FROM logs');
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * @param {string} model 
   * @returns {Promise<number>}
   */
  async getLogCountByModel(model) {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM logs WHERE model = $1',
      [model]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * @param {import('./idb.js').AddApiKeyInput} apiKeyInput 
   * @returns {Promise<import('./idb.js').ApiKey>}
   */
  async addApiKey(apiKeyInput) {
    const result = await this.pool.query(
      'INSERT INTO api_key (key, "userKey", strategies) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
      [apiKeyInput.userKey, JSON.stringify(apiKeyInput.strategies)]
    );
    return result.rows[0];
  }

  /**
   * @param {string} key 
   * @returns {Promise<import('./idb.js').ApiKey|null>}
   */
  async getApiKey(key) {
    const result = await this.pool.query('SELECT * FROM api_key WHERE key = $1', [key]);
    return result.rows[0] || null;
  }

  /**
   * @param {number} id 
   * @param {Partial<import('./idb.js').AddApiKeyInput>} apiKeyInput 
   * @returns {Promise<void>}
   */
  async updateApiKey(id, apiKeyInput) {
    const fields = Object.keys(apiKeyInput);
    const values = Object.values(apiKeyInput);
    const setClause = fields.map((field, index) => {
      if (field === 'strategies') {
        return `${field} = $${index + 2}::json`;
      }
      return `${field} = $${index + 2}`;
    }).join(', ');
    await this.pool.query(
      `UPDATE api_key SET ${setClause} WHERE id = $1`,
      [id, ...values]
    );
  }

  /**
   * @param {number} id 
   * @returns {Promise<void>}
   */
  async deleteApiKey(id) {
    await this.pool.query('DELETE FROM api_key WHERE id = $1', [id]);
  }

  /**
   * @returns {Promise<import('./idb.js').ApiKey[]>}
   */
  async fetchApiKeys() {
    const result = await this.pool.query('SELECT * FROM api_key');
    return result.rows;
  }

  /**
   * Get the definition of a specific table
   * @param {string} tableName 
   * @returns {Promise<import('./idb.js').TableDefinition>}
   */
  async getTableDefinition(tableName) {
    const result = await this.pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        (SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = $1 AND kcu.column_name = c.column_name AND tc.constraint_type = 'PRIMARY KEY'
        )) as is_primary_key,
        (SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = $1 AND kcu.column_name = c.column_name AND tc.constraint_type = 'UNIQUE'
        )) as is_unique
      FROM information_schema.columns c
      WHERE table_name = $1
    `, [tableName]);

    return {
      name: tableName,
      columns: result.rows.map(row => ({
        name: row.column_name,
        type: row.data_type,
        isNullable: row.is_nullable === 'YES',
        isPrimaryKey: row.is_primary_key,
        isUnique: row.is_unique,
        defaultValue: row.column_default
      }))
    };
  }

  /**
   * Get definitions of all tables in the database
   * @returns {Promise<import('./idb.js').TableDefinition[]>}
   */
  async getAllTableDefinitions() {
    const tables = await this.pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const definitions = await Promise.all(
      tables.rows.map(table => this.getTableDefinition(table.table_name))
    );

    return definitions;
  }
}

module.exports = PostgresDatabase;