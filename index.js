require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { urlencoded } = require('body-parser');
const dns = require('dns')
const mongoose = require('mongoose')
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

// Define Urls schema
const urlsSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String
})

// Create shortUrl on document save
urlsSchema.pre("save", async function (next) {
  if (!this.shortUrl) {
    let shortUrl
    let exists = true
    const id = this.id
    while (exists) {
      shortUrl = id.slice(-5)
      exists = await Urls.exists({ shortUrl })
    }
    this.shortUrl = shortUrl
  }
  next()
}) 

// Create Urls model
const Urls = mongoose.model('Urls', urlsSchema)

// Connect to MongoDB.
// Set MONGO_URI in .env
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
}

connectDB()

// Create and store short URL from normal URL
app.post("/api/shorturl", async (req, res) => {
  // Check if URL was submitted
  const originalUrl = req.body.url
  if (!originalUrl) {
    return res.json({error: 'invalid url'})
  }

  // Create URL object
  let url
  try {
    url = new URL(originalUrl)
  } catch {
    return res.json({error: 'invalid url'})
  }

  // Validate URL
  try {
    await dns.promises.lookup(url.hostname)
  } catch (err) {
    console.log(err)
    res.json({error: 'invalid url'})
  }

  // Create and store url document
  try {
    let newUrl = new Urls({ originalUrl })
    await newUrl.save()
    res.json({
      original_url: originalUrl,
      short_url: newUrl.shortUrl
    })
  } catch (err) {
    if (err) console.log(err)
    res.status(500).json({error: "database error"})
  }
})

// Redirect short URL to original URL
app.get("/api/shorturl/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl
  const urlDoc = await Urls.findOne({ shortUrl })
  if (urlDoc) {
    res.redirect(urlDoc.originalUrl)
  } else {
    res.status(404).send('Not Found')
  }  
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
