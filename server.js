require('dotenv').config();
var mongo = require('mongodb');

const express = require('express');
const cors = require('cors');
const app = express();

const bodyParser = require('body-parser');

const shortId = require('shortid');
const validUrl = require('valid-url');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

const connection= mongoose.connection;
connection.on('error',console.error.bind(console, "connection error:"));
connection.once('open', ()=> {
  console.log("Mongo database connected successfully")
});

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});

const URL = mongoose.model('URL', urlSchema);

app.post('/api/shorturl/new', async function(req, res) {
  const url = req.body.url;
  //console.log(url);
  const urlCode = shortId.generate();

  if(!validUrl.isWebUri(url)) {
    res.status(401).json({
      error: "invalid URL"
    })
  }
  else {
    try {
      let findOne = await URL.findOne({
          original_url: url
      })
      if(findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {

        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save()
        res.json({
          original_url: url,
          short_url: urlCode
        })
      }

    }
    catch (err){
      console.error(err)
      res.status(500).json("server error.")
    }
  }
});

app.get('/api/shorturl/:short_url?', async function (req,res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
  } catch (err) {
    console.error(err)
    res.status(500).json("server error.")
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
