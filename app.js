const express = require('express');
const { OpenAI } = require('openai');
const { Server } = require('socket.io');
const http = require('http');
const fs = require('fs').promises; // Include fs.promises for reading files

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000; // Use the environment port if available, otherwise use 3000

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.static('public'));

app.get('/list-data-files', async (req, res) => {
  try {
    const files = await fs.readdir('data');
    const filteredFiles = files.filter(file => file.endsWith('.txt') || file.endsWith('.csv')); // Filtering logic
    res.json(filteredFiles);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

// Socket connection
io.on('connection', (socket) => {
  socket.on('sendPrompt', async ({ prompt, files }) => {
    console.log("Received from client:", { prompt, files });  // Log immediately on receipt

    if (!files || !Array.isArray(files) || !prompt) {
      console.error('Invalid or missing data received from client:', { prompt, files });
      socket.emit('error', 'Invalid or missing prompt or files data');
      return;  // Stop further execution if the data is not correct
    }

    try {
      const fileContents = await Promise.all(
        files.map(file => fs.readFile(`data/${file}`, 'utf8'))
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
          break; // Properly break if the chat completion has finished
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
