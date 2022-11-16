const crawl = require('./crawler');
const { stopCrawl } = require('./crawler');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

require('dotenv').config();

const db = mongoose.createConnection(process.env.DB_URL_WEBDATA, { useNewUrlParser: true });

db.on('error', (error) => {
  logger.log("database error: " + error);
  stopCrawl();
});

crawl(...urlList);
startServer();

const urlList = [
  'https://en.wikipedia.org/wiki/Wikipedia:Popular_pages',
  'https://en.wikipedia.org/wiki/Category:Lists_of_popular_pages_by_WikiProject',
  'https://en.wikipedia.org/wiki/Lists_of_websites',
  // 'https://www.wikihow.com/Special:Sitemap',
  // 'https://myanimelist.net/about/sitemap',
];

function startServer() {
  const express = require('express');
  const cors = require('cors');
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH', 'OPTIONS']
  }));

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    logger.log(`Listening at port ${port}...`);
  })

  app.use(express.json());

  const webRouter = require('./routes/web');
  app.use('/webs', webRouter);

  app.get('/', async (req, res) => {
    res.send("Hello World!");
  })
}
