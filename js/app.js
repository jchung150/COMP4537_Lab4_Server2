const http = require('http');
const url = require('url');

const userStrings = require('../lang/en/en.js'); 

// Define allowed origin 
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://comp4537lab04server1.netlify.app';

class Dictionary {
    constructor() {
        this.entries = {};
        this.requestCount = 0;
    }

    addWord(word, definition) {
        this.requestCount++;
        if (this.entries[word]) {
            return {
                message: userStrings.wordExists,
                requestCount: this.requestCount,
                totalEntries: this.getTotalEntries(),
            };
        } else {
            this.entries[word] = definition;
            return {
                message: `New entry added for '${word}' with definition '${definition}'`,
                requestCount: this.requestCount,
                totalEntries: this.getTotalEntries(),
            };
        }
    }

    getDefinition(word) {
        this.requestCount++;
        if (this.entries[word]) {
            return {
                word: word,
                definition: this.entries[word],
                requestCount: this.requestCount,
            };
        } else {
            return {
                message: userStrings.notFound.replace('{term}', word),
            };
        }
    }

    getTotalEntries() {
        return Object.keys(this.entries).length;
    }
}

const dictionary = new Dictionary();

// Handle CORS Preflight and Requests
function handleCors(res) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Handle POST request
function handlePost(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const parsedBody = JSON.parse(body);
            const word = parsedBody.word;
            const definition = parsedBody.definition;

            if (!word || !definition || !/^[a-zA-Z]+$/.test(word)) {
                res.writeHead(400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 
                });
                res.end(JSON.stringify({ error: userStrings.invalidData }));
                return;
            }

            const result = dictionary.addWord(word, definition);
            res.writeHead(201, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 
            });
            res.end(JSON.stringify(result));
        } catch (e) {
            res.writeHead(400, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 
            });
            res.end(JSON.stringify({ error: userStrings.invalidJSON }));
        }
    });
}

// Handle GET request
function handleGet(req, res) {
    const queryObject = url.parse(req.url, true).query;
    const word = queryObject.word;

    if (!word || !/^[a-zA-Z]+$/.test(word)) {
        res.writeHead(400, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        });
        res.end(JSON.stringify({ error: userStrings.invalidData }));
        return;
    }

    const result = dictionary.getDefinition(word);
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 
    });
    res.end(JSON.stringify(result));
}

// Create the server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Handle OPTIONS request for CORS Preflight
    if (req.method === 'OPTIONS') {
        handleCors(res);
        res.writeHead(204);
        res.end();
    }
    // Handle POST request
    else if (req.method === 'POST' && parsedUrl.pathname === '/api/definitions') {
        handleCors(res);
        handlePost(req, res);
    }
    // Handle GET request
    else if (req.method === 'GET' && parsedUrl.pathname === '/api/definitions') {
        handleCors(res);
        handleGet(req, res);
    }
    // Handle unknown routes
    else {
        res.writeHead(404, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 
        });
        res.end(JSON.stringify({ error: userStrings.endpointNotFound }));
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT);