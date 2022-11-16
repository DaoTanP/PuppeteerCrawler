const mongoose = require('mongoose');
const logger = require('../utils/logger');

require('dotenv').config();

const db = mongoose.createConnection(process.env.DB_URL_URLQUEUE, { useNewUrlParser: true });

const queueSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
});

db.on('error', (error) => {
    logger.log("database error: " + error);
});

db.once('open', () => {
    logger.init('Connected to database: ' + db.db.databaseName);
});

const model = db.model('Queue', queueSchema, 'url_queue');

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

    const checking = await find(url);
    if (checking)
        return;

    const stats = await db.collections.url_queue.stats({ freeStorage: 1, scale: 1048576 })
        .then(stats => { return stats });

    if (stats.totalSize > 510)
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

const find = async (url) => {
    const element = await model.find({ "url": url }).lean();
    if (!element.url)
        return undefined;

    return element.url;
}

module.exports = {
    popQueue,
    pushQueue,
    getQueue,
}