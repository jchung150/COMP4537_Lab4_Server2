const http = require('http');
const url = require('url');

// Importing the userStrings from the correct path
const userStrings = require('../lang/en/user');

// Dictionary class to store words and their definitions
class Dictionary {
    constructor() {
        this.entries = {}; // Dictionary entries { word: definition }
        this.requestCount = 0; // Total number of requests handled
    }

    // Add a new word and definition
    addWord(word, definition) {
        this.requestCount++;
        if (this.entries[word]) {
            return {
                message: userStrings.wordExists,  // Using localized message
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

    // Get the definition of a word
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
                message: userStrings.notFound.replace('{term}', word),  // Replacing placeholder
            };
        }
    }

    // Get the total number of dictionary entries
    getTotalEntries() {
        return Object.keys(this.entries).length;
    }
}

// Instantiate the dictionary
const dictionary = new Dictionary();

// Function to handle CORS preflight requests (OPTIONS)
function handleCors(req, res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
}

// Function to handle POST requests for adding new words
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
                res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: userStrings.invalidData }));  // Using localized message
                return;
            }

            const result = dictionary.addWord(word, definition);
            res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(result));
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: userStrings.invalidJSON }));  // Handling invalid JSON error
        }
    });
}

// Function to handle GET requests for retrieving definitions
function handleGet(req, res) {
    const queryObject = url.parse(req.url, true).query;
    const word = queryObject.word;

    if (!word || !/^[a-zA-Z]+$/.test(word)) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: userStrings.invalidData }));  // Using localized message
        return;
    }

    const result = dictionary.getDefinition(word);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(result));
}

// Create the server and handle requests
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        handleCors(req, res);
    }
    // Handle POST requests to add a word and definition
    else if (req.method === 'POST' && parsedUrl.pathname === '/api/definitions') {
        handlePost(req, res);
    }
    // Handle GET requests to retrieve a word's definition
    else if (req.method === 'GET' && parsedUrl.pathname === '/api/definitions') {
        handleGet(req, res);
    }
    // Handle unknown routes
    else {
        res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: userStrings.endpointNotFound }));  // Using localized message
    }
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});