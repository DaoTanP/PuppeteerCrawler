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
db.once('open', () => {
  // logger.init('Connected to database: ' + db.db.databaseName);

  const stat = db.db.stats({ freeStorage: 1 });
  if (stat.totalFreeStorageSize < 10) {
    stopCrawl();
  }

  try {
    crawl(...urlList);
    startServer();
  } catch (error) {
    logger.log(error);
  }
  // finally {
  //   stopCrawl();
  // }
});

const urlList = [
  'https://en.wikipedia.org/wiki/Special:AllPages',
  'https://en.wiktionary.org/wiki/Special:AllPages',
  'https://en.wikiquote.org/wiki/Special:AllPages',
  'https://en.wikibooks.org/wiki/Special:AllPages',
  'https://en.wikisource.org/wiki/Special:AllPages',
  'https://en.wikipedia.org/wiki/Lists_of_websites',
  'https://en.wikipedia.org/wiki/Wikipedia:Contents/Lists',
  'https://en.wikipedia.org/wiki/Category:Lists_of_superlatives',
  'https://www.wikihow.com/Special:Sitemap',
  'https://community.fandom.com/wiki/Special:AllPages',
  'https://www.reddit.com/subreddits/a-1',
  'https://www.reddit.com/subreddits/0-1',
  'https://help.imdb.com/article/imdb/general-information/imdb-site-index/GNCX7BHNSPBTFALQ#so',
  'https://myanimelist.net/about/sitemap',
  'https://dictionary.cambridge.org/dictionary/english',
  'https://edition.cnn.com/sitemap.html',
  'https://www.nytimes.com/sitemap',
  'https://www.forbes.com',
  'https://www.amazon.com',
];

function startServer() {
  const express = require('express');
  const cors = require('cors');
  const app = express();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
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
