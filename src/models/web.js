const mongoose = require('mongoose');

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

const model = mongoose.model('Web', webSchema, 'web_pages');
model.createIndexes();
module.exports = model;

const getPage = async (url, title, content) => {
  let page = await model.findOne({ url: url, title: title, content: content });
  if (!page)
  page = await model.findOne({ title: title, content: content });
  if (!page)
  page = await model.findOne({ url: url, title: title });
  if (!page)
  page = await model.findOne({ url: url });
  if (!page)
    return undefined;

  console.log('Found page: ' + page.title);
  return page;
};

const updatePage = async (url, title, content) => {
  try {
    const oldPage = await getPage(url, title, content);
    oldPage.url = url;
    oldPage.title = title;
    oldPage.content = content;
    const updatedPage = await oldPage.save();
    console.log('Duplicate page updated: ' + updatedPage.title);
    return updatedPage;
  } catch (error) {
    throw error;
  }
}

const insertPage = async (url, title, content) => {
    const p = updatePage(url, title, content);
  if(p)
    return p;
  
  const page = new model({
    url: url,
    title: title,
    content: content
  });
  try {
    const newPage = await page.save();
    console.log('New record added: ' + newPage.title);
  } catch (error) {
    // console.log(error.message);
    throw error;
  }
}

module.exports.getPage = getPage;
module.exports.updatePage = updatePage;
module.exports.insertPage = insertPage;