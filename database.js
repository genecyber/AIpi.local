const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class Database {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseAnonKey = process.env.SUPABASE_KEY;

        // Initialize the Supabase client
        this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
    }

    initialize() {
        console.log('Supabase client initialized');
    }

    async storeLog(prompt, response, model) {
        try {
            const { data, error } = await this.supabase
                .from('logs')
                .insert([{ prompt, response, model }]);

            if (error) throw error;
            console.log('Log stored:', data);
        } catch (error) {
            console.error('Error storing log:', error);
        }
    }

    async fetchLogs() {
        try {
            const { data, error } = await this.supabase
                .from('logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching logs:', error);
            return [];
        }
    }

    async fetchLogsByModel(model) {
        try {
            const { data, error } = await this.supabase
                .from('logs')
                .select('*')
                .eq('model', model)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching logs by model:', error);
            return [];
        }
    }

    async addCustomEndpoint(endpoint) {
        const { path, method, model, prompt_template } = endpoint;
        
        try {
            const { data, error } = await this.supabase
                .from('custom_endpoints')
                .insert([{ path, method, model, prompt_template }]);

            if (error) throw error;
            console.log('Custom endpoint stored:', data);
        } catch (error) {
            console.error('Error adding custom endpoint to the database:', error);
        }
    }

    async setBaseConfiguration(key, value) {
        try {
            const { data, error } = await this.supabase
                .from('base_configurations')
                .upsert({ config_key: key, config_value: value }, { onConflict: 'config_key' })
                .single();

            if (error) throw error;
            console.log('Base configuration set:', data);
        } catch (error) {
            console.error('Error setting base configuration:', error);
        }
    }

    async fetchCustomEndpoints() {
        try {
            const { data, error } = await this.supabase
                .from('custom_endpoints')
                .select('*');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching custom endpoints:', error);
            return [];
        }
    }

    async getBaseConfiguration(key) {
        try {
            const { data, error } = await this.supabase
                .from('base_configurations')
                .select('config_value')
                .eq('config_key', key)
                .single();

            if (error) throw error;
            return data ? data.config_value : null;
        } catch (error) {
            console.error('Error fetching base configuration:', error);
            return null;
        }
    }
}

module.exports = Database;
