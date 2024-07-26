const fs = require('fs').promises;
const path = require('path');
const DatabaseInterface = require('./idb.js');

class InMemoryFSDatabase extends DatabaseInterface {
  constructor(persistenceDir) {
    super();
    this.persistenceDir = persistenceDir;
    this.data = {
      base_configurations: [],
      custom_endpoints: [],
      logs: [],
      api_keys: []
    };
    this.isDirty = false;
    this.saveInterval = null;
  }

  async initialize() {
    await this.ensureDataStructure();
    await this.loadFromDisk();
    this.startPeriodicSave();
  }

  async ensureDataStructure() {
    try {
      await fs.mkdir(this.persistenceDir, { recursive: true });
      for (const key of Object.keys(this.data)) {
        const filePath = path.join(this.persistenceDir, `${key}.json`);
        try {
          await fs.access(filePath);
        } catch (error) {
          // File doesn't exist, create it with an empty array
          await fs.writeFile(filePath, JSON.stringify([], null, 2));
        }
      }
    } catch (error) {
      console.error('Error ensuring data structure:', error);
    }
  }

  async loadFromDisk() {
    for (const key of Object.keys(this.data)) {
      const filePath = path.join(this.persistenceDir, `${key}.json`);
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        this.data[key] = JSON.parse(fileContent);
      } catch (error) {
        console.error(`Error loading ${key} from disk:`, error);
        this.data[key] = []; // Ensure we have an empty array if loading fails
      }
    }
  }

  startPeriodicSave() {
    this.saveInterval = setInterval(async () => {
      if (this.isDirty) {
        await this.saveToDisk();
        this.isDirty = false;
      }
    }, 5000); // Save every 5 seconds if there are changes
  }

  async saveToDisk() {
    try {
      for (const [key, value] of Object.entries(this.data)) {
        const filePath = path.join(this.persistenceDir, `${key}.json`);
        await fs.writeFile(filePath, JSON.stringify(value, null, 2));
      }
    } catch (error) {
      console.error('Error saving data to disk:', error);
    }
  }

  // ... [All previously defined methods remain the same]

  /**
   * @param {import('./idb.js').AddApiKeyInput} apiKeyInput 
   * @returns {Promise<import('./idb.js').ApiKey>}
   */
  async addApiKey(apiKeyInput) {
    const newApiKey = {
      ...apiKeyInput,
      id: this.data.api_keys.length + 1,
      key: this.generateUniqueKey(),
      created_at: new Date().toISOString()
    };
    this.data.api_keys.push(newApiKey);
    this.isDirty = true;
    return newApiKey;
  }

  /**
   * @param {string} key 
   * @returns {Promise<import('./idb.js').ApiKey|null>}
   */
  async getApiKey(key) {
    return this.data.api_keys.find(apiKey => apiKey.key === key) || null;
  }

  /**
   * @param {number} id 
   * @param {Partial<import('./idb.js').AddApiKeyInput>} apiKeyInput 
   * @returns {Promise<void>}
   */
  async updateApiKey(id, apiKeyInput) {
    const index = this.data.api_keys.findIndex(apiKey => apiKey.id === id);
    if (index !== -1) {
      this.data.api_keys[index] = { ...this.data.api_keys[index], ...apiKeyInput };
      this.isDirty = true;
    } else {
      throw new Error('API key not found');
    }
  }

  /**
   * @param {number} id 
   * @returns {Promise<void>}
   */
  async deleteApiKey(id) {
    const index = this.data.api_keys.findIndex(apiKey => apiKey.id === id);
    if (index !== -1) {
      this.data.api_keys.splice(index, 1);
      this.isDirty = true;
    }
  }

  /**
   * @returns {Promise<import('./idb.js').ApiKey[]>}
   */
  async fetchApiKeys() {
    return this.data.api_keys;
  }

  /**
   * Get the definition of a specific table
   * @param {string} tableName 
   * @returns {Promise<import('./idb.js').TableDefinition>}
   */
  async getTableDefinition(tableName) {
    const mockTableDefinitions = {
      base_configurations: [
        { name: 'id', type: 'integer', isNullable: false, isPrimaryKey: true, isUnique: true, defaultValue: null },
        { name: 'config_key', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: true, defaultValue: null },
        { name: 'config_value', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: null },
        { name: 'created_at', type: 'timestamp', isNullable: true, isPrimaryKey: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', isNullable: true, isPrimaryKey: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' }
      ],
      custom_endpoints: [
        { name: 'id', type: 'integer', isNullable: false, isPrimaryKey: true, isUnique: true, defaultValue: null },
        { name: 'path', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: true, defaultValue: null },
        { name: 'method', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: null },
        { name: 'model', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: null },
        { name: 'prompt_template', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: null },
        { name: 'strategy', type: 'text', isNullable: true, isPrimaryKey: false, isUnique: false, defaultValue: null },
        { name: 'created_at', type: 'timestamp', isNullable: true, isPrimaryKey: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' }
      ],
      logs: [
        { name: 'id', type: 'integer', isNullable: false, isPrimaryKey: true, isUnique: true, defaultValue: null },
        { name: 'prompt', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: null },
        { name: 'response', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: null },
        { name: 'model', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: null },
        { name: 'created_at', type: 'timestamp', isNullable: true, isPrimaryKey: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' }
      ],
      api_keys: [
        { name: 'id', type: 'integer', isNullable: false, isPrimaryKey: true, isUnique: true, defaultValue: null },
        { name: 'key', type: 'text', isNullable: false, isPrimaryKey: false, isUnique: true, defaultValue: null },
        { name: 'userKey', type: 'text', isNullable: true, isPrimaryKey: false, isUnique: false, defaultValue: null },
        { name: 'strategies', type: 'json', isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: '{}' },
        { name: 'created_at', type: 'timestamp', isNullable: true, isPrimaryKey: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' }
      ]
    };

    return { name: tableName, columns: mockTableDefinitions[tableName] || [] };
  }

  /**
   * Get definitions of all tables in the database
   * @returns {Promise<import('./idb.js').TableDefinition[]>}
   */
  async getAllTableDefinitions() {
    const tables = ['base_configurations', 'custom_endpoints', 'logs', 'api_keys'];
    const definitions = await Promise.all(tables.map(table => this.getTableDefinition(table)));
    return definitions;
  }

  generateUniqueKey() {
    return 'key_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = InMemoryFSDatabase;