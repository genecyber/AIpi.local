let dbInstance;

const initAuthMiddleware = (db) => {
    dbInstance = db;
};

const baseAuthCheck = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    // Prevent access if no API key is provided
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is required' });
    }

    // Fetch the API key from the database
    const apiKeyFromDb = await dbInstance.getApiKey(apiKey);

    // Prevent access if the API key doesn't match any key in the database
    if (!apiKeyFromDb) {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    next();
};

const highSecurityMiddleware = async (req, res, next) => {
    await baseAuthCheck(req, res, async () => {
        // Implement high security level checks
        next();
    });
};

const configuredMiddleware = async (req, res, next) => {
    next(req, res)
};

module.exports = {
    initAuthMiddleware,
    highSecurityMiddleware,
    configuredMiddleware    
};