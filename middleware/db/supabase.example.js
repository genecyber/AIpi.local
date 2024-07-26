const { createClient } = require('@supabase/supabase-js');
const DatabaseInterface = require('./idb.js');

class SupabaseDatabase extends DatabaseInterface {
  /**
   * @param {string} supabaseUrl 
   * @param {string} supabaseKey 
   */
  constructor(supabaseUrl, supabaseKey) {
    super();
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async initialize() {
    // No initialization needed for Supabase
  }

  /**
   * @param {string} key 
   * @returns {Promise<string|null>}
   */
  async getBaseConfiguration(key) {
    const { data, error } = await this.supabase
      .from('base_configurations')
      .select('config_value')
      .eq('config_key', key)
      .single();

    if (error) throw error;
    return data ? data.config_value : null;
  }

  /**
   * @param {string} key 
   * @param {string} value 
   * @returns {Promise<void>}
   */
  async setBaseConfiguration(key, value) {
    const { error } = await this.supabase
      .from('base_configurations')
      .upsert({ config_key: key, config_value: value }, { onConflict: 'config_key' });

    if (error) throw error;
  }

  /**
   * @returns {Promise<import('./idb.js').BaseConfiguration[]>}
   */
  async getAllBaseConfigurations() {
    const { data, error } = await this.supabase
      .from('base_configurations')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * @param {import('./idb.js').AddCustomEndpointInput} endpoint 
   * @returns {Promise<void>}
   */
  async addCustomEndpoint(endpoint) {
    const { error } = await this.supabase
      .from('custom_endpoints')
      .insert(endpoint);

    if (error) throw error;
  }

  /**
   * @returns {Promise<import('./idb.js').CustomEndpoint[]>}
   */
  async fetchCustomEndpoints() {
    const { data, error } = await this.supabase
      .from('custom_endpoints')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * @param {string} path 
   * @returns {Promise<import('./idb.js').CustomEndpoint|null>}
   */
  async getCustomEndpointByPath(path) {
    const { data, error } = await this.supabase
      .from('custom_endpoints')
      .select('*')
      .eq('path', path)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * @param {number} id 
   * @param {Partial<import('./idb.js').AddCustomEndpointInput>} endpoint 
   * @returns {Promise<void>}
   */
  async updateCustomEndpoint(id, endpoint) {
    const { error } = await this.supabase
      .from('custom_endpoints')
      .update(endpoint)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * @param {number} id 
   * @returns {Promise<void>}
   */
  async deleteCustomEndpoint(id) {
    const { error } = await this.supabase
      .from('custom_endpoints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * @param {import('./idb.js').AddLogInput} log 
   * @returns {Promise<void>}
   */
  async addLog(log) {
    const { error } = await this.supabase
      .from('logs')
      .insert(log);

    if (error) throw error;
  }

  /**
   * @param {number} [limit] 
   * @param {number} [offset] 
   * @returns {Promise<import('./idb.js').LogEntry[]>}
   */
  async fetchLogs(limit, offset) {
    let query = this.supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit !== undefined) query = query.limit(limit);
    if (offset !== undefined) query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * @param {string} model 
   * @param {number} [limit] 
   * @param {number} [offset] 
   * @returns {Promise<import('./idb.js').LogEntry[]>}
   */
  async fetchLogsByModel(model, limit, offset) {
    let query = this.supabase
      .from('logs')
      .select('*')
      .eq('model', model)
      .order('created_at', { ascending: false });

    if (limit !== undefined) query = query.limit(limit);
    if (offset !== undefined) query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * @returns {Promise<number>}
   */
  async getLogCount() {
    const { count, error } = await this.supabase
      .from('logs')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  }

  /**
   * @param {string} model 
   * @returns {Promise<number>}
   */
  async getLogCountByModel(model) {
    const { count, error } = await this.supabase
      .from('logs')
      .select('*', { count: 'exact', head: true })
      .eq('model', model);

    if (error) throw error;
    return count;
  }

  /**
   * @param {import('./idb.js').AddApiKeyInput} apiKeyInput 
   * @returns {Promise<import('./idb.js').ApiKey>}
   */
  async addApiKey(apiKeyInput) {
    const { data, error } = await this.supabase
      .from('api_key')
      .insert(apiKeyInput)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * @param {string} key 
   * @returns {Promise<import('./idb.js').ApiKey|null>}
   */
  async getApiKey(key) {
    const { data, error } = await this.supabase
      .from('api_key')
      .select('*')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * @param {number} id 
   * @param {Partial<import('./idb.js').AddApiKeyInput>} apiKeyInput 
   * @returns {Promise<void>}
   */
  async updateApiKey(id, apiKeyInput) {
    const { error } = await this.supabase
      .from('api_key')
      .update(apiKeyInput)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * @param {number} id 
   * @returns {Promise<void>}
   */
  async deleteApiKey(id) {
    const { error } = await this.supabase
      .from('api_key')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * @returns {Promise<import('./idb.js').ApiKey[]>}
   */
  async fetchApiKeys() {
    const { data, error } = await this.supabase
      .from('api_key')
      .select('*');

    if (error) throw error;
    return data;
  }

  /**
   * Get the definition of a specific table
   * @param {string} tableName 
   * @returns {Promise<import('./idb.js').TableDefinition>}
   */
  async getTableDefinition(tableName) {
    const { data, error } = await this.supabase
      .rpc('get_table_definition', { table_name: tableName });

    if (error) throw error;

    return {
      name: tableName,
      columns: data.map(column => ({
        name: column.column_name,
        type: column.data_type,
        isNullable: column.is_nullable === 'YES',
        isPrimaryKey: column.is_primary_key,
        isUnique: column.is_unique,
        defaultValue: column.column_default
      }))
    };
  }

  /**
   * Get definitions of all tables in the database
   * @returns {Promise<import('./idb.js').TableDefinition[]>}
   */
  async getAllTableDefinitions() {
    const { data, error } = await this.supabase
      .rpc('get_all_table_definitions');

    if (error) throw error;

    return Object.entries(data).map(([tableName, columns]) => ({
      name: tableName,
      columns: columns.map(column => ({
        name: column.column_name,
        type: column.data_type,
        isNullable: column.is_nullable === 'YES',
        isPrimaryKey: column.is_primary_key,
        isUnique: column.is_unique,
        defaultValue: column.column_default
      }))
    }));
  }
}

module.exports = SupabaseDatabase;