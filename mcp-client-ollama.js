#!/usr/bin/env node
/*const readline = require('readline');
const axios = require('axios');

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  let buffer = '';
  rl.on('line', async (line) => {
    buffer += line;

    try {
      const task = JSON.parse(buffer);
      buffer = '';

      const prompt = task.args?.query || task.args?.prompt || JSON.stringify(task);

      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'llama3',
        prompt,
        stream: false
      });

      const reply = {
        id: task.id,
        result: {
          content: response.data.response
        }
      };

      process.stdout.write(JSON.stringify(reply) + '\n');

    } catch (e) {
      // Waiting for full JSON or JSON parse error
      if (!(e instanceof SyntaxError)) {
        console.error('Error:', e);
      }
    }
  });
}

main();*/

const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

console.error('MCP Ollama Client is running and waiting for tasks...');

rl.on('line', async (line) => {
  try {
    console.error('\n Received input from MCP server:');
    console.error(line);

    const task = JSON.parse(line);
    const taskId = task.id || 'no-id';

    const prompt = `You are a JSON API. Respond with only a valid JSON object. Do not explain or wrap in natural language.\n\n${task.args?.query || task.args?.prompt || JSON.stringify(task)}`;
    //const prompt= 'Hello'
    console.error(`\n Sending prompt to Ollama:\n"${prompt}"`);

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt,
      stream: false
    });

    const llmReply = response.data.response;
    console.error(`\n Ollama response:\n"${llmReply}"`);

    // ✅ Output must be valid JSON on stdout
    const output = {
      id: taskId,
      result: {
        content: llmReply
      }
    };
   
    process.stdout.write(JSON.stringify(output) + '\n');

  } catch (err) {
    console.error('\n Error processing MCP task:', err);
  }
});

