const mongoose = require('mongoose');
const logger = require('../utils/logger');

const queueSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
})

const model = mongoose.model('Queue', queueSchema, 'queue');

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
        logger.log(`${newElement.url} pushed into queue.`);
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