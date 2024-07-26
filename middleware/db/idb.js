/**
 * @typedef {Object} BaseConfiguration
 * @property {number} id
 * @property {string} config_key
 * @property {string} config_value
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * @typedef {Object} CustomEndpoint
 * @property {number} id
 * @property {string} path
 * @property {string} method
 * @property {string} model
 * @property {string} prompt_template
 * @property {string} [strategy]
 * @property {string} [codeGen]
 * @property {string} [apiKey]
 * @property {Date} created_at
 */

/**
 * @typedef {Object} LogEntry
 * @property {number} id
 * @property {string} prompt
 * @property {string} response
 * @property {string} model
 * @property {Date} created_at
 */

/**
 * @typedef {Object} AddCustomEndpointInput
 * @property {string} path
 * @property {string} method
 * @property {string} model
 * @property {string} prompt_template
 * @property {string} [strategy]
 * @property {string} [codeGen]
 * @property {string} [apiKey]
 */

/**
 * @typedef {Object} AddLogInput
 * @property {string} prompt
 * @property {string} response
 * @property {string} model
 */

/**
 * @typedef {Object} ApiKey
 * @property {number} id
 * @property {string} key
 * @property {string} [userKey]
 * @property {Object} strategies
 */

/**
 * @typedef {Object} AddApiKeyInput
 * @property {string} [userKey]
 * @property {Object} strategies
 */

/**
 * @typedef {Object} Migration
 * @property {string} version
 * @property {string} description
 * @property {Function} up
 * @property {Function} down
 */

class DatabaseInterface {
  /**
   * Initialize the database connection and apply any pending migrations
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('Method not implemented.');
  }

  /**
   * Get the current schema version
   * @returns {Promise<string>}
   */
  async getCurrentSchemaVersion() {
    throw new Error('Method not implemented.');
  }

  /**
   * Set the current schema version
   * @param {string} version 
   * @returns {Promise<void>}
   */
  async setSchemaVersion(version) {
    throw new Error('Method not implemented.');
  }

  /**
   * Apply a single migration
   * @param {Migration} migration 
   * @returns {Promise<void>}
   */
  async applyMigration(migration) {
    throw new Error('Method not implemented.');
  }

  /**
   * Apply all pending migrations
   * @returns {Promise<void>}
   */
  async applyPendingMigrations() {
    throw new Error('Method not implemented.');
  }

  /**
   * Rollback the last applied migration
   * @returns {Promise<void>}
   */
  async rollbackLastMigration() {
    throw new Error('Method not implemented.');
  }

  /**
   * Get a base configuration value by key
   * @param {string} key 
   * @returns {Promise<string|null>}
   */
  async getBaseConfiguration(key) {
    throw new Error('Method not implemented.');
  }

  /**
   * Set a base configuration value
   * @param {string} key 
   * @param {string} value 
   * @returns {Promise<void>}
   */
  async setBaseConfiguration(key, value) {
    throw new Error('Method not implemented.');
  }

  /**
   * Get all base configurations
   * @returns {Promise<BaseConfiguration[]>}
   */
  async getAllBaseConfigurations() {
    throw new Error('Method not implemented.');
  }

  /**
   * Add a new custom endpoint
   * @param {AddCustomEndpointInput} endpoint 
   * @returns {Promise<void>}
   */
  async addCustomEndpoint(endpoint) {
    throw new Error('Method not implemented.');
  }

  /**
   * Fetch all custom endpoints
   * @returns {Promise<CustomEndpoint[]>}
   */
  async fetchCustomEndpoints() {
    throw new Error('Method not implemented.');
  }

  /**
   * Get a custom endpoint by its path
   * @param {string} path 
   * @returns {Promise<CustomEndpoint|null>}
   */
  async getCustomEndpointByPath(path) {
    throw new Error('Method not implemented.');
  }

  /**
   * Update a custom endpoint
   * @param {number} id 
   * @param {Partial<AddCustomEndpointInput>} endpoint 
   * @returns {Promise<void>}
   */
  async updateCustomEndpoint(id, endpoint) {
    throw new Error('Method not implemented.');
  }

  /**
   * Delete a custom endpoint
   * @param {number} id 
   * @returns {Promise<void>}
   */
  async deleteCustomEndpoint(id) {
    throw new Error('Method not implemented.');
  }

  /**
   * Add a new log entry
   * @param {AddLogInput} log 
   * @returns {Promise<void>}
   */
  async addLog(log) {
    throw new Error('Method not implemented.');
  }

  /**
   * Fetch logs with optional pagination
   * @param {number} [limit] 
   * @param {number} [offset] 
   * @returns {Promise<LogEntry[]>}
   */
  async fetchLogs(limit, offset) {
    throw new Error('Method not implemented.');
  }

  /**
   * Fetch logs by model with optional pagination
   * @param {string} model 
   * @param {number} [limit] 
   * @param {number} [offset] 
   * @returns {Promise<LogEntry[]>}
   */
  async fetchLogsByModel(model, limit, offset) {
    throw new Error('Method not implemented.');
  }

  /**
   * Get total log count
   * @returns {Promise<number>}
   */
  async getLogCount() {
    throw new Error('Method not implemented.');
  }

  /**
   * Get log count for a specific model
   * @param {string} model 
   * @returns {Promise<number>}
   */
  async getLogCountByModel(model) {
    throw new Error('Method not implemented.');
  }

  /**
   * Add a new API key
   * @param {AddApiKeyInput} apiKeyInput 
   * @returns {Promise<ApiKey>}
   */
  async addApiKey(apiKeyInput) {
    throw new Error('Method not implemented.');
  }

  /**
   * Get an API key by its key
   * @param {string} key 
   * @returns {Promise<ApiKey|null>}
   */
  async getApiKey(key) {
    throw new Error('Method not implemented.');
  }

  /**
   * Update an API key
   * @param {number} id 
   * @param {Partial<AddApiKeyInput>} apiKeyInput 
   * @returns {Promise<void>}
   */
  async updateApiKey(id, apiKeyInput) {
    throw new Error('Method not implemented.');
  }

  /**
   * Delete an API key
   * @param {number} id 
   * @returns {Promise<void>}
   */
  async deleteApiKey(id) {
    throw new Error('Method not implemented.');
  }

  /**
   * Fetch all API keys
   * @returns {Promise<ApiKey[]>}
   */
  async fetchApiKeys() {
    throw new Error('Method not implemented.');
  }
}

module.exports = DatabaseInterface;