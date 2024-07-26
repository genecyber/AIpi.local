const { useState, useEffect } = React;

function App() {
    const [llmType, setLlmType] = useState('openai');
    const [configuredLlmType, setConfiguredLlmType] = useState('');
    const [configuredModel, setConfiguredModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
    const [models, setModels] = useState([]);
    const [customEndpoints, setCustomEndpoints] = useState([]);
    const [hasBaseConfig, setHasBaseConfig] = useState(false);
    const [newEndpoint, setNewEndpoint] = useState({ path: '', method: 'GET', model: '', prompt_template: '' });
    const [showConfigForm, setShowConfigForm] = useState(true);

    useEffect(() => {
        fetchBaseConfiguration();
    }, []);

    useEffect(() => {
        if (hasBaseConfig) {
            fetchConfiguredEndpoints();
        }
    }, [hasBaseConfig]);

    useEffect(() => {
        if (configuredLlmType) {
            fetchModels(); // <-- Modified: Trigger fetchModels on llmType change
        }
    }, [llmType, configuredLlmType]);

    const fetchBaseConfiguration = async () => {
        try {
            const response = await fetch('/api/base-configuration');
            if (response.ok) {
                const data = await response.json();
                setHasBaseConfig(data.valid);
                if (data.valid) {
                    setConfiguredLlmType(data.llmType); // Store configured LLM type
                    setConfiguredModel(data.model);     // Store configured model
                }
            } else {
                console.error('Failed to fetch base configuration');
            }
        } catch (error) {
            console.error('Error fetching base configuration:', error);
        }
    };

    const fetchModels = async () => {
        try {
            const response = await fetch(`/api/models?llmType=${configuredLlmType}`);
            if (response.ok) {
                const data = await response.json();
                setModels(data);
                if (data.length > 0) setConfiguredModel(data[0].id); // Optionally set default model
            } else {
                console.error('Failed to fetch models');
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    };

    const fetchConfiguredEndpoints = async () => {
        try {
            const response = await fetch('/api/custom-endpoints');
            if (response.ok) {
                const data = await response.json();
                setCustomEndpoints(data);
            } else {
                console.error('Failed to fetch custom endpoints');
            }
        } catch (error) {
            console.error('Error fetching custom endpoints:', error);
        }
    };

    const handleSaveConfig = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('/api/configure-llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ llmType, apiKey, model })
            });
            if (response.ok) {
                const result = await response.json();
                alert(result.message || 'Configuration saved successfully.');
                setHasBaseConfig(true);
                setShowConfigForm(false);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to save configuration.');
            }
        } catch (error) {
            console.error('Error saving configuration:', error);
        }
    };

    const handleAddEndpoint = async (event) => {
        event.preventDefault();
        try {
            // Use configuredModel if newEndpoint.model is empty
            const modelToUse = newEndpoint.model || configuredModel;

            if (!modelToUse) {
                alert('No model selected or configured. Please select a model.');
                return;
            }

            const response = await fetch('/api/custom-endpoints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: newEndpoint.path,
                    method: newEndpoint.method,
                    model: modelToUse,
                    prompt_template: newEndpoint.prompt_template
                })
            });
            if (response.ok) {
                alert('Endpoint added successfully.');
                fetchConfiguredEndpoints(); // Refresh the list of endpoints
                setNewEndpoint({ path: '', method: 'GET', model: '', prompt_template: '' }); // Reset form
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to add endpoint.');
            }
        } catch (error) {
            console.error('Error adding endpoint:', error);
        }
    };


    return (
        <div className="container">
            <h1>LLM Configuration</h1>
            <button onClick={() => setShowConfigForm(!showConfigForm)}>
                {showConfigForm ? 'Hide Configuration Form' : 'Show Configuration Form'}
            </button>
            {showConfigForm && (
                <form onSubmit={handleSaveConfig}>
                    <div className="form-group">
                        <label htmlFor="llmType">Select LLM</label>
                        <select id="llmType" value={llmType} onChange={e => setLlmType(e.target.value)} required>
                            <option value="openai">OpenAI</option>
                            <option value="ollama">Ollama</option>
                        </select>
                    </div>
                    {llmType === 'openai' && (
                        <div className="form-group">
                            <label htmlFor="apiKey">API Key (for OpenAI)</label>
                            <input
                                type="text"
                                id="apiKey"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="Enter your OpenAI API key"
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="model">Select Model</label>
                        <select id="model" value={model} onChange={e => setModel(e.target.value)} required>
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit">Save Configuration</button>
                </form>
            )}
            {hasBaseConfig && (
                <>
                    <h2>Custom Endpoints</h2>
                    <ul>
                        {customEndpoints.map(endpoint => (
                            <li key={endpoint.path}>{`Path: ${endpoint.path}, Method: ${endpoint.method}, Model: ${endpoint.model}`}</li>
                        ))}
                    </ul>
                    <h3>Add New Endpoint</h3>
                    <form onSubmit={handleAddEndpoint}>
                        <div className="form-group">
                            <label htmlFor="endpointPath">Endpoint Path</label>
                            <input
                                type="text"
                                id="endpointPath"
                                value={newEndpoint.path}
                                onChange={e => setNewEndpoint({ ...newEndpoint, path: e.target.value })}
                                placeholder="/custom-path"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="httpMethod">HTTP Method</label>
                            <select
                                id="httpMethod"
                                value={newEndpoint.method}
                                onChange={e => setNewEndpoint({ ...newEndpoint, method: e.target.value })}
                                required
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="endpointModel">Model</label>
                            <select
                                id="endpointModel"
                                value={newEndpoint.model}
                                onChange={e => setNewEndpoint({ ...newEndpoint, model: e.target.value })}
                                required
                            >
                                {models.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="prompt_template">Prompt Template</label>
                            <input
                                type="text"
                                id="prompt_template"
                                value={newEndpoint.prompt_template}
                                onChange={e => setNewEndpoint({ ...newEndpoint, prompt_template: e.target.value })}
                                placeholder="Translate the following: {input}"
                                required
                            />
                        </div>
                        <button type="submit">Add Endpoint</button>
                    </form>
                </>
            )}
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
