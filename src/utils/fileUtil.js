const fs = require('fs');

function writeFile(filePath, ...content) {
    fs.writeFileSync(filePath, content.join('\n'), (err) => {
        if (err) throw err;
    });
}

function readFile(filePath) {
    if (!fs.existsSync(filePath))
        return undefined;

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

function deleteFile(filePath) {
    if (!fs.existsSync(filePath))
        return;

    fs.unlink(filePath, function (err) {
        if (err) throw err;
    });
}

module.exports = {
    writeFile,
    readFile,
    deleteFile,
}