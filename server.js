require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/elasticsearch/search', async (req, res) => {
  console.log('[INFO] Received /elasticsearch/search request');
  const mcpInput = JSON.stringify(req.body) + '\n';

  //Spawn MCP Server (Elasticsearch)
  console.log('[INFO] Spawning MCP server...');
  const mcpServer = spawn('mcp-server-elasticsearch', [], {
    env: {
      ...process.env,
      ES_URL: process.env.ES_URL,
      ES_API_KEY: process.env.ES_API_KEY,
      OTEL_LOG_LEVEL: process.env.OTEL_LOG_LEVEL || 'debug'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    mcpServer.stderr.on('data', (data) => {
    console.error('[MCP SERVER STDERR]', data.toString());
  });
    mcpServer.on('error', (err) => {
    console.error('[ERROR] Failed to start MCP server:', err);
  });


  // Spawn MCP Client (Ollama)

let mcpClient;
try {
  console.log('[INFO] Spawning MCP client...');
  mcpClient = spawn('node', ['./mcp-client-ollama.js'], {
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  mcpClient.on('error', (err) => {
    console.error('[ERROR] Failed to start MCP client:', err);
  });

  mcpClient.stderr.on('data', (data) => {
    console.error('[MCP CLIENT STDERR]', data.toString());
  });

  mcpClient.stdout.on('data', (data) => {
    console.log('[MCP CLIENT STDOUT]', data.toString());
  });

} catch (err) {
  console.error('[FATAL] Could not spawn MCP client:', err);
  return res.status(500).json({ error: 'MCP client failed to start' });
}



  // Wire MCP Client to Server
  mcpServer.stdout.pipe(mcpClient.stdin);
  mcpClient.stdout.pipe(mcpServer.stdin);
  // Send the input once
  mcpServer.stdin.write(mcpInput);
  mcpServer.stdin.end();

  // Capture MCP Server Output to return to HTTP client 
  let stdout = '';
  let stderr = '';

  mcpServer.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  mcpServer.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  //Send MCP input to the server
  mcpServer.stdin.write(mcpInput);
  mcpServer.stdin.end();

  mcpServer.on('close', (code) => {
    console.log('STDOUT:', stdout);
    console.error('STDERR:', stderr);

    if (code !== 0) {
      return res.status(500).json({ error: stderr || 'Error in MCP server' });
    }

    try {
      const json = JSON.parse(stdout);
      res.json(json);
    } catch (err) {
      res.status(500).json({ error: 'Failed to parse MCP response' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Elasticsearch MCP microservice running on port ${PORT}`);
});

