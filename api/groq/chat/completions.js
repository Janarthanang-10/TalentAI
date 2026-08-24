export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    
    // Check for authorization header passed from client
    let authHeader = req.headers.authorization;
    if (!authHeader && apiKey) {
        authHeader = `Bearer ${apiKey}`;
    }

    if (!authHeader) {
        console.error("Vercel Error: GROQ API Key missing.");
        return res.status(401).json({ error: 'API Key not configured' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Vercel Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error during AI proxy' });
    }
}
