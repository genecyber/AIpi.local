const { createClient } = require('@supabase/supabase-js');
const DatabaseInterface = require('./middleware/db/idb.js');
const fs = require('fs').promises;
const path = require('path');

class SupabaseDatabase extends DatabaseInterface {
  constructor() {
    super();
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  async initialize() {
    try {
      await this.ensureSchemaVersionTable();
      await this.applyPendingMigrations();
    } catch (error) {
      console.error('Error during database initialization:', error);
      throw error; // Re-throw the error if you want to propagate it
    }
  }

  async ensureSchemaVersionTable() {
    const { error } = await this.supabase.rpc('create_schema_versions_if_not_exists');
    if (error) throw error;
  }

  async getCurrentSchemaVersion() {
    const { data, error } = await this.supabase
      .from('schema_versions')
      .select('version')
      .order('applied_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data ? data.version : '0.0.0';
  }

  async setSchemaVersion(version) {
    const { error } = await this.supabase
      .from('schema_versions')
      .insert({ version });

    if (error) throw error;
  }

  async applyMigration(migration) {
    const { error } = await this.supabase.rpc('apply_migration', {
      migration_sql: migration.up
    });
    if (error) throw error;
    await this.setSchemaVersion(migration.version);
  }

  async applyPendingMigrations() {
    const currentVersion = await this.getCurrentSchemaVersion();
    const migrations = await this.loadMigrations();

    for (const migration of migrations) {
      if (this.compareVersions(migration.version, currentVersion) > 0) {
        console.log(`Applying migration: ${migration.version}`);
        await this.applyMigration(migration);
      }
    }
  }

  async rollbackLastMigration() {
    const currentVersion = await this.getCurrentSchemaVersion();
    const migrations = await this.loadMigrations();
    
    const lastAppliedMigration = migrations
      .filter(m => this.compareVersions(m.version, currentVersion) <= 0)
      .pop();

    if (lastAppliedMigration) {
      console.log(`Rolling back migration: ${lastAppliedMigration.version}`);
      const { error } = await this.supabase.rpc('apply_migration', {
        migration_sql: lastAppliedMigration.down
      });
      if (error) throw error;

      await this.supabase
        .from('schema_versions')
        .delete()
        .eq('version', lastAppliedMigration.version);

      const newCurrentVersion = migrations
        .filter(m => this.compareVersions(m.version, lastAppliedMigration.version) < 0)
        .pop()?.version || '0.0.0';

      await this.setSchemaVersion(newCurrentVersion);
    }
  }

  async loadMigrations() {
    const files = await fs.readdir(this.migrationsDir);
    return files
      .filter(file => file.endsWith('.js'))
      .map(file => require(path.join(this.migrationsDir, file)))
      .sort((a, b) => this.compareVersions(a.version, b.version));
  }

  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }

  async getBaseConfiguration(key) {
    const { data, error } = await this.supabase
      .from('base_configurations')
      .select('config_value')
      .eq('config_key', key)
      .single();

    if (error) throw error;
    return data ? data.config_value : null;
  }

  async setBaseConfiguration(key, value) {
    const { error } = await this.supabase
      .from('base_configurations')
      .upsert({ config_key: key, config_value: value }, { onConflict: 'config_key' });

    if (error) throw error;
  }

  async getAllBaseConfigurations() {
    const { data, error } = await this.supabase
      .from('base_configurations')
      .select('*');

    if (error) throw error;
    return data;
  }

  async addCustomEndpoint(endpoint) {
    const { error } = await this.supabase
      .from('custom_endpoints')
      .insert(endpoint);

    if (error) throw error;
  }

  async fetchCustomEndpoints() {
    const { data, error } = await this.supabase
      .from('custom_endpoints')
      .select('*');

    if (error) throw error;
    return data;
  }

  async getCustomEndpointByPath(path) {
    const { data, error } = await this.supabase
      .from('custom_endpoints')
      .select('*')
      .eq('path', path)
      .single();

    if (error) throw error;
    return data;
  }

  async updateCustomEndpoint(id, endpoint) {
    const { error } = await this.supabase
      .from('custom_endpoints')
      .update(endpoint)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteCustomEndpoint(id) {
    const { error } = await this.supabase
      .from('custom_endpoints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async addLog(log) {
    const { error } = await this.supabase
      .from('logs')
      .insert(log);

    if (error) throw error;
  }

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

  async getLogCount() {
    const { count, error } = await this.supabase
      .from('logs')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  }

  async getLogCountByModel(model) {
    const { count, error } = await this.supabase
      .from('logs')
      .select('*', { count: 'exact', head: true })
      .eq('model', model);

    if (error) throw error;
    return count;
  }

  async addApiKey(apiKeyInput) {
    const { data, error } = await this.supabase
      .from('api_key')
      .insert(apiKeyInput)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getApiKey(key) {
    const { data, error } = await this.supabase
      .from('api_key')
      .select('*')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data;
  }

  async updateApiKey(id, apiKeyInput) {
    const { error } = await this.supabase
      .from('api_key')
      .update(apiKeyInput)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteApiKey(id) {
    const { error } = await this.supabase
      .from('api_key')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async fetchApiKeys() {
    const { data, error } = await this.supabase
      .from('api_key')
      .select('*');

    if (error) throw error;
    return data;
  }

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