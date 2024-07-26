const express = require('express');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');
const authMiddleware = require('./middleware/auth.js');
const Database = require('./supabase.js');
require('dotenv').config();


// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('json spaces', 2);

// Initialize the OpenAI client
let openai;
function initializeOpenAI(apiKey) {
    const configuration = new Configuration({
        apiKey: apiKey,
    });
    openai = new OpenAIApi(configuration);
}

// Initialize the MockDatabase
const db = new Database();
(async () => await db.initialize())();
authMiddleware.initAuthMiddleware(db);

// In-memory storage for custom endpoints
const customEndpoints = {};

// Endpoint to fetch available models from OpenAI or Ollama
app.get('/api/models', async (req, res) => {
    const { llmType } = req.query;

    try {
        let models = [];
        if (llmType === 'openai' && openai) {
            const response = await openai.Model.list();
            models = response.data.data.map(model => ({ id: model.id, name: model.id }));
        } else if (llmType === 'ollama') {
            models = await fetchOllamaModels(); 
        }
        res.json(models);
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: 'Failed to fetch models.' });
    }
});

async function performInference(prompt, modelOverride = false) {
    try {
        // Fetch the configured LLM type and model from the database
        const llmType = await db.getBaseConfiguration('llm_type');
        const model = await db.getBaseConfiguration('llm_model');

        if (llmType === 'openai' && openai) {
            const response = await openai.Completion.create({
                model: modelOverride? modelOverride: model, // Use the configured model
                prompt: prompt,
                max_tokens: 150,
            });
            return { result: response.data.choices[0].text };
        } else if (llmType === 'ollama') {
            let response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 150,
                    "stream": false
                })
            });
            if (!response.ok) {
                throw new Error('Failed to get inference from Ollama');
            }
            const result = await response.json();
            return { result: result.message.content };
        } else {
            throw new Error('Invalid LLM type or LLM not configured.');
        }
    } catch (error) {
        console.error('Error during inference:', error);
        throw new Error('Failed to perform inference.');
    }
}

app.post('/api/generate', authMiddleware.highSecurityMiddleware, async (req, res) => {
    const { prompt } = req.body;
    try {
        const result = await performInference(prompt);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function fetchOllamaModels() {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) {
            throw new Error('Failed to fetch models from Ollama');
        }
        const models = await response.json();
        return models.models.map(model => ({ id: model.model, name: model.name }));
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        return [];
    }
}

app.get('/api/base-configuration', async (req, res) => {
    try {
        const llmType = await db.getBaseConfiguration('llm_type');
        const model = await db.getBaseConfiguration('llm_model');
        if (llmType && model) {
            res.json({ valid: true, llmType, model }); // <-- Include llmType and model in response
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        console.error('Error checking base configuration:', error);
        res.status(500).json({ error: 'Failed to check base configuration.' });
    }
});



// Endpoint to configure LLM settings
app.post('/api/configure-llm', authMiddleware.highSecurityMiddleware, async (req, res) => {
    const { llmType, apiKey, model } = req.body;

    try {
        // Store the LLM type and model in the database
        await db.setBaseConfiguration('llm_type', llmType);
        await db.setBaseConfiguration('llm_model', model);

        if (llmType === 'openai' && apiKey) {
            await db.setBaseConfiguration('openai_api_key', apiKey);
            await initializeOpenAI(); // Initialize OpenAI client with the new API key
            res.json({ message: 'OpenAI configured successfully.' });
        } else if (llmType === 'ollama') {
            // No API key needed for Ollama in this example
            res.json({ message: 'Ollama configured successfully.' });
        } else {
            res.status(400).json({ error: 'Invalid configuration parameters.' });
        }
    } catch (error) {
        console.error('Error configuring LLM:', error);
        res.status(500).json({ error: 'Failed to configure LLM.' });
    }
});


// Endpoint to fetch all logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await db.fetchLogs();
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs.' });
    }
});

// Endpoint to fetch logs by model
app.get('/api/logs/:model', async (req, res) => {
    const { model } = req.params;

    try {
        const logs = await db.fetchLogsByModel(model);
        res.json(logs);
    } catch (error) {
        console.error(`Error fetching logs for model ${model}:`, error);
        res.status(500).json({ error: `Failed to fetch logs for model ${model}.` });
    }
});

// Endpoint to configure custom endpoints
app.post('/api/custom-endpoints', authMiddleware.highSecurityMiddleware, async (req, res) => {
    const { path, method, model, prompt_template } = req.body;

    if (!path || !method || !model || !prompt_template) {
        return res.status(400).json({ error: 'Invalid configuration parameters.' });
    }

    try {
        // Save custom endpoint to the database
        await db.addCustomEndpoint({ path, method, model, prompt_template });
        res.json({ message: `Custom endpoint '${path}' configured successfully.` });
    } catch (error) {
        console.error('Error saving custom endpoint:', error);
        res.status(500).json({ error: 'Failed to configure custom endpoint.' });
    }
});


// Endpoint to fetch all custom endpoints
app.get('/api/custom-endpoints', async (req, res) => {
    try {
        const customEndpoints = await db.fetchCustomEndpoints();
        res.json(customEndpoints || []);
    } catch (error) {
        console.error('Error fetching custom endpoints:', error);
        res.status(500).json({ error: 'Failed to fetch custom endpoints.' });
    }
});

// Wildcard route to handle custom endpoints
app.all('*', authMiddleware.configuredMiddleware, async (req, res) => {
    const { path } = req;

    try {
        // Fetch custom endpoints from the database
        const customEndpoints = await db.fetchCustomEndpoints();
        const endpoint = customEndpoints.find(endpoint => endpoint.path === path);

        if (endpoint) {
            const { method, prompt_template } = endpoint;

            if (req.method.toLowerCase() === method.toLowerCase()) {
                // Generate prompt from request and template
                let inference = await performInference(prompt_template)
                try {
                    res.json(JSON.parse(inference.result));
                } catch (error) {
                    res.send(inference);
                }
            } else {
                res.status(405).json({ error: 'Method Not Allowed' });
            }
        } else {
            res.status(404).json({ error: 'Not Found' });
        }
    } catch (error) {
        console.error('Error fetching custom endpoints:', error);
        res.status(500).json({ error: 'Failed to fetch custom endpoints.' });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
