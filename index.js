require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { urlencoded } = require('body-parser');
const dns = require('dns')
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(express.urlencoded({extended: true}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const urlMap= {}

app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url
  if (!originalUrl) {
    return res.json({error: 'invalid url'})
  }

  let url
  try {
    url = new URL(originalUrl)
  } catch {
    return res.json({error: 'invalid url'})
  }
  
  dns.lookup(url.hostname, (err, address) => {
    if (err) {
      return res.json({error: 'invalid url'})
    } else {
      const shortUrl = Object.keys(urlMap).length + 1
      urlMap[shortUrl] = originalUrl
      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      })
    }
  })
})

app.get("/api/shorturl/:shortUrl", (req, res) => {
  const shortUrl = req.params.shortUrl
  if (shortUrl in urlMap) {
    res.redirect(urlMap[shortUrl])
  } else {
    res.status(404).send('Not Found')
  }
  
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
