const http = require('http');
const url = require('url');
const userStrings = require('./lang/en/en.js');

// Define allowed origin as a variable
const ALLOWED_ORIGIN = 'https://comp4537lab04server1.netlify.app';

let dictionary = [];
let totalRequests = 0;

// Function to handle GET requests
function handleGETRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/definitions') { 
        const word = parsedUrl.query.word;
        const result = dictionary.find(entry => entry.word === word);

        if (result) {
            totalRequests++;
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN
            });
            res.end(JSON.stringify({
                word: result.word,
                definition: result.definition,
                totalRequests: totalRequests,
                totalEntries: dictionary.length
            }));
        } else {
            res.writeHead(404, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN
            });
            res.end(JSON.stringify({ message: userStrings.notFound.replace('{term}', word) }));
        }
    } else {
        res.writeHead(404, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN
        });
        res.end(JSON.stringify({ message: userStrings.endpointNotFound }));
    }
}

// Function to handle POST requests
function handlePOSTRequest(req, res) {
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const word = data.word;
            const definition = data.definition;

            if (word && definition) {
                totalRequests++;
                const existingWordIndex = dictionary.findIndex(entry => entry.word === word);

                if (existingWordIndex !== -1) {
                    res.writeHead(400, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': ALLOWED_ORIGIN
                    });
                    res.end(JSON.stringify({ message: userStrings.wordExists }));
                } else {
                    dictionary.push({ word, definition });
                    res.writeHead(201, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': ALLOWED_ORIGIN
                    });
                    res.end(JSON.stringify({
                        message: `Word '${word}' added successfully!`,
                        totalRequests: totalRequests,
                        totalEntries: dictionary.length
                    }));
                }
            } else {
                res.writeHead(400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': ALLOWED_ORIGIN
                });
                res.end(JSON.stringify({ error: userStrings.invalidData }));
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            res.writeHead(400, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN
            });
            res.end(JSON.stringify({ error: userStrings.invalidJSON }));
        }
    });
}

// Function to handle OPTIONS requests (for CORS preflight)
function handleOptionsRequest(res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
}

// Create the server
const server = http.createServer((req, res) => {
    const method = req.method;
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (method === 'GET' && pathname === '/api/definitions') {
        handleGETRequest(req, res);
    } else if (method === 'POST' && pathname === '/api/definitions') {
        handlePOSTRequest(req, res);
    } else if (method === 'OPTIONS') {
        handleOptionsRequest(res);
    } else {
        res.writeHead(405, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN
        });
        res.end(JSON.stringify({ message: 'Method not allowed.' }));
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT);