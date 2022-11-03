function removeNewlines(string) {
    return string.replace(/[\n\r\t\s{2,}]/g, " ");
}

function lowercase(string) {
    return string.toLowerCase();
}

function tokenize(string) {
    return string.split(" ").filter(element => {
        return element !== '';
      });
}

function preProcess(string) {
    let processed = removeNewlines(string);
    processed = lowercase(processed);
    processed = tokenize(processed);
    
    return processed;
}