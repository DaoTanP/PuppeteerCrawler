const fs = require("fs");
const fileUtil = require("./fileUtil");

const filePath = './log.txt';

const init = (...params) => {
    fileUtil.deleteFile(filePath);

    log(params);
}

const log = (...params) => {
    // const msg = params.join(' ');

    // console.log(msg);
}

const getLog = (callback = undefined) => {
    fs.watch(filePath, (eventName, filename) => {
        // console.log('Event: ' + eventName);
        fileContent = fileUtil.readFile(filePath);
        if (callback)
            callback(fileContent);
    });
}

module.exports = {
    init,
    log,
    getLog,
}