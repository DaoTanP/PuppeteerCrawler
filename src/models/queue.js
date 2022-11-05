const mongoose = require('mongoose');
const logger = require('../utils/logger');

require('dotenv').config();

const queuedb = mongoose.createConnection(process.env.DB_URL_URLQUEUE, { useNewUrlParser: true });

const queueSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
});

queuedb.on('error', (error) => {
    logger.log("database error: " + error);
});

queuedb.once('open', () => {
    logger.init('Connected to database: ' + queuedb.db.databaseName);
});

const model = queuedb.model('Queue', queueSchema, 'url_queue');

const popQueue = async () => {
    const element = await model.findOne();
    if (!element)
        return undefined;

    await model.deleteOne(element);

    logger.log('Popped in queue: ', element.url);
    return element.url;
};

const pushQueue = async (url) => {
    if (!url)
        return;

    const element = new model({
        url: url,
    });

    try {
        const newElement = await element.save();
        // logger.log('Pushed in queue: ', newElement.url);
    } catch (error) {
        // logger.log(error.message);
        throw error;
    }
}

const getQueue = async () => {
    const queue = await model.find();
    if (!queue)
        return undefined;

    return queue;
}

module.exports = {
    popQueue,
    pushQueue,
    getQueue,
}