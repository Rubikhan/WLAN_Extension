const fs = require('fs');
const express = require('express');
const path = require('path');
const http = require('http');
const reload = require('reload');
const ip = require('ip');
const chokidar = require('chokidar');
const open = require('open');
const { Anthropic } = require('@anthropic-ai/sdk');
const { OpenAI } = require('openai');

// load the config file
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const API_KEY = config.ANTHROPIC_API_KEY;
const ajarai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

const app = express();
const publicDir = path.join(__dirname, 'public');

app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// route to serve number of lines
app.get('/config-lines', (req, res) => {
  fs.readFile(path.join(publicDir, 'config.txt'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading config.txt:', err);
      res.status(500).send('Error reading config file');
      return;
    }
    const lines = data.split('\n').find(line => line.startsWith('NO_OF_LINES='));
    const NO_OF_LINES = lines ? parseInt(lines.split('=')[1], 10) : 18;
    res.json({ NO_OF_LINES });
  });
});

app.get('/translate', async (req, res) => {
  const { text, numLines, apiDesig } = req.query;
  if (apiDesig === "clawdy") {
    const anthropic = new Anthropic({ apiKey: API_KEY });
    try {
      const msg = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1024,
        messages: [{ role: "user", content: `Translate the following Japanese video game text to English:\n\n${text} (note: this text is raw and has not been completely sanitized. Text will be somewhat like a visual novel, switching between dialogue, narration, and expository description. Please use your best judgement when translating)` }],
      });
      res.json(msg.content[0].text);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  } else if (apiDesig === "geepeetee4") {
    try {
      const chatCompletion = await ajarai.chat.completions.create({
        messages: [{ role: 'user', content: `Translate the following Japanese video game text to English:\n\n${text} (note: this text is raw and has not been completely sanitized. Text will be somewhat like a visual novel, switching between dialogue, narration, and expository description. Please use your best judgement when translating. Please refrain from bookending the translation with superfluous niceties)` }],
        model: 'gpt-4o',
      });
      res.json(chatCompletion.choices[0].message.content);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
});

const server = http.createServer(app);

const watcher = chokidar.watch('public/text/line1', {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

reload(app).then(function (reloadReturned) {
  server.listen(app.get('port'), function () {
    console.log('Web server listening on http://' + ip.address() + ':' + app.get('port') + '/');
    console.log('If you want to open the page from a different device, use the IP address above, not localhost.');
    open('http://localhost:' + app.get('port') + '/');
    watcher.on('change', function (path) {
      reloadReturned.reload();
    })
  });
}).catch(function (err) {
  console.error('Reload could not start, could not start server/sample app', err);
});
