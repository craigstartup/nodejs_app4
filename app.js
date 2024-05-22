const express = require('express');
const { OpenAI } = require('openai');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.static('public'));

app.get('/list-data-files', async (req, res) => {
  try {
    const files = await fs.readdir('data');
    const filteredFiles = files.filter(file => file.endsWith('.txt') || file.endsWith('.csv'));
    res.json(filteredFiles);
  } catch (error) {
    console.error('Failed to read directory:', error);
    res.status(500).send(`Error reading directory: ${error.path}`);
  }
});

io.on('connection', (socket) => {
  socket.on('sendPrompt', async ({ prompt, files }) => {
    console.log("Received from client:", { prompt, files });

    if (!files || !Array.isArray(files) || !prompt) {
      console.error('Invalid or missing data received from client:', { prompt, files });
      socket.emit('error', 'Invalid or missing prompt or files data');
      return;
    }

    // Filter out invalid filenames
    const validFiles = files.filter(file => file && file.trim() !== '' && file !== 'on');
    console.log("Valid files:", validFiles);

    try {
      const fileContents = await Promise.all(
        validFiles.map(file => {
          const filePath = `data/${file.trim()}`;
          console.log(`Reading file: ${filePath}`);
          return fs.readFile(filePath, 'utf8');
        })
      );

      const messages = fileContents.map(content => ({ role: 'user', content }));
      messages.unshift({ role: 'system', content: 'You are an editorial assistant creating marketing materials from online course transcripts.' });
      messages.push({ role: 'user', content: prompt });

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: messages,
        stream: true,
      });

      for await (const chunk of completion) {
        socket.emit('responseChunk', { content: chunk.choices[0].delta.content, finish_reason: chunk.choices[0].finish_reason });
        if (chunk.choices[0].finish_reason) {
          break;
        }
      }
    } catch (error) {
      console.error('Error processing prompt:', error);
      socket.emit('error', error.toString());
    }
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
