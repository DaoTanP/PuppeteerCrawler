const mongoose = require('mongoose');
const logger = require('../utils/logger');

require('dotenv').config();

const db = mongoose.createConnection(process.env.DB_URL_WEBDATA, { useNewUrlParser: true });

db.on('error', (error) => {
  logger.log("database error: " + error);
  stopCrawl();
});
db.once('open', () => {
  logger.init('Connected to database: ' + db.db.databaseName);
});

const webSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
})

webSchema.index({
  "content": "text",
  "title": "text"
});

const model = db.model('Web', webSchema, 'web_pages');
// model.createIndexes();

const getPage = async (url, title, content) => {
  if (!url || !title || !content)
    return undefined;

  let page = await model.findOne({ url: url, title: title, content: content });
  if (!page)
    page = await model.findOne({ title: title, content: content });
  if (!page)
    page = await model.findOne({ url: url, title: title });
  if (!page)
    page = await model.findOne({ url: url });
  if (!page)
    return undefined;

  logger.log('Found page: ', page.title);
  return page;
};

const updatePage = async (url, title, content) => {
  if (!url || !title || !content)
    return undefined;

  const oldPage = await getPage(url, title, content);
  if (!oldPage)
    return undefined;

  oldPage.url = url;
  oldPage.title = title;
  oldPage.content = content;
  const updatedPage = await oldPage.save();
  logger.log('Duplicate page updated: ', updatedPage.title);
  return updatedPage;
}

const insertPage = async (url, title, content) => {
  if (!url || !title || !content)
    return;

  const p = await updatePage(url, title, content);
  if (p)
    return;

  const page = new model({
    url: url,
    title: title,
    content: content
  });

  try {
    const newPage = await page.save();
    logger.log('New record added: ', newPage.title);
  } catch (error) {
    // logger.log(error.message);
    throw error;
  }
}

exports.Web = model;
exports.getPage = getPage;
exports.updatePage = updatePage;
exports.insertPage = insertPage;