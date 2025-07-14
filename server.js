require('dotenv').config();
console.log('ES_URL:', process.env.ES_URL);
console.log('ES_API_KEY:', process.env.ES_API_KEY);

const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/elasticsearch/search', async (req, res) => {
  const mcpInput = JSON.stringify(req.body) + '\n';

  const proc = spawn('mcp-server-elasticsearch', [], {
  env: {
    ...process.env,
    ES_URL: process.env.ES_URL,
    ES_API_KEY: process.env.ES_API_KEY,
    OTEL_LOG_LEVEL: process.env.OTEL_LOG_LEVEL || 'none'
  }
});



  let stdout = '';
  let stderr = '';

  proc.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  proc.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  proc.stdin.write(mcpInput);
  proc.stdin.end();

  proc.on('close', (code) => {
    console.log('STDOUT:', stdout);
    console.log('STDERR:', stderr);

    if (code !== 0) {
      return res.status(500).json({ error: stderr || 'Error in MCP tool' });
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
