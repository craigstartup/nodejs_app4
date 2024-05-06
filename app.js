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

// Socket connection
io.on('connection', (socket) => {
  socket.on('sendPrompt', async (prompt) => {
    try {
      // Adjusted file paths to the 'data' directory
      const talk1Content = await fs.readFile('data/SueBryce PowerTalk 01 - What is Self-Love.txt', 'utf8');
      const talk2Content = await fs.readFile('data/SueBryce PowerTalk 02 - Identity.txt', 'utf8');
      const talk3Content = await fs.readFile('data/SueBryce PowerTalk 03 - Suffering.txt', 'utf8');
      const talk4Content = await fs.readFile('data/SueBryce PowerTalk 04 - Avoidance.txt', 'utf8');
      const talk5Content = await fs.readFile('data/SueBryce PowerTalk 05 - Self Perception.txt', 'utf8');
      const talk6Content = await fs.readFile('data/SueBryce PowerTalk 06 - Creation.txt', 'utf8');
      const talk7Content = await fs.readFile('data/SueBryce PowerTalk 07 - Love.txt', 'utf8');
      const talk8Content = await fs.readFile('data/SueBryce PowerTalk 08 - Money.txt', 'utf8');
      const talk9Content = await fs.readFile('data/SueBryce PowerTalk 09 - Body.txt', 'utf8');
      const talk10Content = await fs.readFile('data/SueBryce PowerTalk 10 - Community.txt', 'utf8');
      const talk11Content = await fs.readFile('data/SueBryce PowerTalk 11 - Work.txt', 'utf8');
      const talk12Content = await fs.readFile('data/SueBryce PowerTalk 12 - Awareness.txt', 'utf8');
      const talk13Content = await fs.readFile('data/SueBryce PowerTalk 13 - Acceptance.txt', 'utf8');
      const talk14Content = await fs.readFile('data/SueBryce PowerTalk 14 - Processing.txt', 'utf8');
      const talk15Content = await fs.readFile('data/SueBryce PowerTalk 15 - Boundaries.txt', 'utf8');
      const talk16Content = await fs.readFile('data/SueBryce PowerTalk 16 - Unfolding.txt', 'utf8');
      const talk17Content = await fs.readFile('data/SueBryce PowerTalk 17 - Alignment.txt', 'utf8');
      const talk18Content = await fs.readFile('data/SueBryce PowerTalk 18 - Daily Ritual.txt', 'utf8');
      const talksummaryContent = await fs.readFile('data/SueBryce PowerTalk Summaries.txt', 'utf8');

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {role: "system", content: "You are an editorial assistant creating marketing materials from online course transcripts."},
          {role: "user", content: talk1Content},
          {role: "user", content: talk2Content},
          {role: "user", content: talk3Content},
          {role: "user", content: talk4Content},
          {role: "user", content: talk5Content},
          {role: "user", content: talk6Content},
          {role: "user", content: talk7Content},
          {role: "user", content: talk8Content},
          {role: "user", content: talk9Content},
          {role: "user", content: talk10Content},
          {role: "user", content: talk11Content},
          {role: "user", content: talk12Content},
          {role: "user", content: talk13Content},
          {role: "user", content: talk14Content},
          {role: "user", content: talk15Content},
          {role: "user", content: talk16Content},
          {role: "user", content: talk17Content},
          {role: "user", content: talk18Content},
          {role: "user", content: talksummaryContent},
          {role: "user", content: prompt}
        ],
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
