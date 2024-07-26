const { useState, useEffect } = React;

// Function to capture API calls
const captureApiCall = (url, method, body) => {
    if (window.CAPTURE_API_CALLS) {
        console.log('API Call Captured:', { url, method, body });
        // In a real implementation, you might want to store this data
        // in localStorage or send it to a server for later use
    }
};

// Wrapper for fetch that captures API calls and includes API key if available
const captureFetch = (url, options = {}) => {
    captureApiCall(url, options.method || 'GET', options.body);
    const headers = options.headers || {};
    const savedSettings = localStorage.getItem('appSettings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    if (settings.apiKey) {
        headers['x-api-key'] = settings.apiKey;
    }
    return fetch(url, { ...options, headers });
};

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
    const [showConfigForm, setShowConfigForm] = useState(true); // Always show config form initially
    const [captured, setCaptured] = useState(null)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [settings, setSettings] = useState({ theme: 'light', notifications: true });

    useEffect(() => {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const toggleSettingsModal = () => {
        setIsSettingsModalOpen(!isSettingsModalOpen);
    };

    const updateSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
    };

    useEffect(() => {
        fetchBaseConfiguration();
    }, []);

    useEffect(() => {
        if (hasBaseConfig) {
            fetchConfiguredEndpoints();
            setShowConfigForm(false); // Hide config form if base config is valid
        }
    }, [hasBaseConfig]);

    useEffect(() => {
        if (configuredLlmType) {            
            fetchModels(); // <-- Modified: Trigger fetchModels on llmType change
        }
    }, [llmType, configuredLlmType]);

    const fetchBaseConfiguration = async () => {
        try {
            const response = await captureFetch('/api/base-configuration');
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
            const response = await captureFetch(`/api/models?llmType=${configuredLlmType}`);
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
            const response = await captureFetch('/api/custom-endpoints');
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
            const response = await captureFetch('/api/configure-llm', {
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

            const response = await captureFetch('/api/custom-endpoints', {
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
            <h1>LLM Configuration{hasBaseConfig} </h1>
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                    onClick={() => setShowConfigForm(!showConfigForm)}
                    style={{ flex: 1, marginRight: '10px', width: '100%' }}
                >
                    {!showConfigForm ? 'Show Configuration Form' : 'Hide Configuration Form'}
                </button>
                <button
                    onClick={() => toggleSettingsModal(true)}
                    style={{ flex: 1, marginLeft: '10px', width: '100%' }}
                >
                    Open Settings
                </button>
            </div>


            {showConfigForm && (
                <form onSubmit={handleSaveConfig}>
                    <div className="form-group">
                        
                    </div>
                    
                    <div className="form-group">
                        
                    </div>
                    <button type="submit">Save Configuration</button>
                </form>
            )}
            {hasBaseConfig && (
                <>
                    <h2>Custom Endpoints</h2>
                    <ul>
                        {customEndpoints.map(endpoint => (
                            <li key={endpoint.path} onClick={async () => {
                                document.getElementById('responseBox').style.height = '200px';
                                let captured = await captureFetch(endpoint.path);
                                setCaptured(JSON.stringify(endpoint, null, 4));
                            }}>
                                {`Path: ${endpoint.path}, Method: ${endpoint.method}, Model: ${endpoint.model}`}
                            </li>
                        ))}
                    </ul>
                    <div className="form-group">
                        <textarea
                            id="responseBox"
                            rows="1"
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', backgroundColor: '#3c3c3c', color: '#d4d4d4', height: '20px' }}
                            readOnly
                            value={captured}
                        />
                    </div>
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
                    <h3>Response</h3>
                    <div className="form-group">
                        <textarea
                            id="responseBox"
                            rows="10"
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', backgroundColor: '#3c3c3c', color: '#d4d4d4' }}
                            readOnly
                        />
                    </div>
                </>
            )}
            {isSettingsModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={toggleSettingsModal}>&times;</span>
                        <h2>Settings</h2>
                        <div className="form-group">
                            <label htmlFor="settingsApiKey">Server API Key</label>
                            <input
                                type="text"
                                id="settingsApiKey"
                                onChange={e => updateSettings({ ...settings, apiKey: e.target.value })}
                                value={settings.apiKey || ''}
                                placeholder="Enter your Server API key"
                            />
                        </div>
                        <button onClick={toggleSettingsModal}>Save Settings</button>
                    </div>
                </div>
            )}
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
