const fs = require("fs");

const filePath = './log.txt';

const init = (...params) => {
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, function (err) {
            if (err) throw err;
        });
    }

    log(params);
}

const log = (...params) => {
    fs.appendFile(filePath, params.join(' ') + '\n', (err) => {
        if (err) throw err;
        console.log(params);
    });
}

const getLog = (callback = undefined) => {
    fs.watch(filePath, (eventName, filename) => {
        // console.log('Event: ' + eventName);
        fileContent = readFile(filePath);
        if (callback)
            callback(fileContent);
    });
}

const readFile = (filePath) => {
    // Use fs.createReadStream() method
    // to read the file
    reader = fs.createReadStream(filePath, {
        flag: 'r',
        encoding: 'UTF-8',
    });

    // Read and display the file data on console
    reader.on('data', function (log) {
        return log;
    });
}

module.exports = {
    init,
    log,
    getLog,
}