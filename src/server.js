const crawl = require('./crawler');
const { stopCrawl } = require('./crawler');
const mongoose = require('mongoose');
const logger = require('./utils/logger');

require('dotenv').config();

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', (error) => logger.log(error));
db.once('open', () => {
  logger.init('Connected to database: ' + db.db.databaseName);
  try {
    crawl(...urlList);
    startServer();
  } catch (error) {
    logger.log(error);
  }

  db.db.stats(function (err, stats) {
    if (stats.storageSize / 1048576 > 500) {
      stopCrawl();
    }
  });
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

  app.get('/', (req, res) => {
    res.send("Hello World");
  })
}
