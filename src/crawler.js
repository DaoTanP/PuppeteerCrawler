const fs = require('fs');
const puppeteer = require('puppeteer');
const { insertPage } = require('./models/web');
const logger = require('./utils/logger');

const linksQueue = [];
const seenLinksQueue = [];
let numberOfPagesCrawled = 0;

let stopCrawling = false;

module.exports = crawl;
exports.stopCrawl = stopCrawl;

async function crawl(...urls) {
  const linksQueue = [];

  const pushQueue = (link) => {
    if (seenLinksQueue.indexOf(link) != -1)
      return;

    linksQueue.push(link);
  }

  const popQueue = () => {
    if (linksQueue.length === 0)
      return undefined;

    const link = linksQueue.shift();
    seenLinksQueue.push(link);
    return link;
  }

  for (let url of urls) {
    pushQueue(url);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  // const page = (await browser.pages())[0];

  while (!stopCrawling && linksQueue.length !== 0) {
    let url = popQueue();
    if (url === undefined)
      break;

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.goto(url, { timeout: 0, waitUntil: 'load' }),
      // page.waitForSelector('body'),
    ]);

    await waitTillHTMLRendered(page);

    //remove ads
    await page.evaluate((sel) => {
      let elements = document.querySelectorAll(sel);
      for (let i = 0; i < elements.length; i++) {
        elements[i].parentNode.removeChild(elements[i]);
      }
    }, "iframe");

    const pageUrl = page.url();
    const title = await page.title();
    const content = await page.$eval('*', (el) => el.innerText);

    await handleData(pageUrl, title, content);
    numberOfPagesCrawled++;
    logger.log("Number of pages crawled: ", numberOfPagesCrawled);
    console.log("Number of pages crawled: ", numberOfPagesCrawled);

    const pageUrls = await page.evaluate(() => {
      const urlArray = Array.from(document.links).map((link) => link.href);
      const uniqueUrlArray = [...new Set(urlArray)];
      return uniqueUrlArray;
    });

    pageUrls.forEach((url) => pushQueue(url));
  }

  await browser.close();
};

async function crawlGlobally(...urls) {
  for (let url of urls) {
    pushQueue(url);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  // const page = (await browser.pages())[0];

  while (!stopCrawling && linksQueue.length !== 0) {
    let url = popQueue();
    if (url === undefined)
      break;

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.goto(url, { timeout: 0, waitUntil: 'load' }),
      // page.waitForSelector('body'),
    ]);

    await waitTillHTMLRendered(page);

    //remove ads
    await page.evaluate((sel) => {
      let elements = document.querySelectorAll(sel);
      for (let i = 0; i < elements.length; i++) {
        elements[i].parentNode.removeChild(elements[i]);
      }
    }, "iframe");

    const pageUrl = page.url();
    const title = await page.title();
    const content = await page.$eval('*', (el) => el.innerText);

    await handleData(pageUrl, title, content);

    const pageUrls = await page.evaluate(() => {
      const urlArray = Array.from(document.links).map((link) => link.href);
      const uniqueUrlArray = [...new Set(urlArray)];
      return uniqueUrlArray;
    });

    pageUrls.forEach((url) => pushQueue(url));
  }

  await browser.close();
};

function pushQueue(link) {
  if (seenLinksQueue.indexOf(link) != -1)
    return;

  linksQueue.push(link);
}

function popQueue() {
  if (linksQueue.length === 0)
    return undefined;

  const link = linksQueue.shift();
  seenLinksQueue.push(link);
  return link;
}

async function handleData(url, title, content) {
  if (!url && !title && !content) {
    return;
  }
  // fs.appendFile('./data.txt', url + '\n' + title + '\n' + content, (err) => {
  //   if (err) throw err;
  //   logger.log('Page content was appended to file!');
  // });

  await insertPage(url, title, content);
}

function stopCrawl() {
  stopCrawling = true;
}

async function waitTillHTMLRendered(page, timeout = 30000) {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while (checkCounts++ <= maxChecks) {
    let html = await page.content();
    let currentHTMLSize = html.length;

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    logger.log('last: ', lastHTMLSize, '\tcurrent: ', currentHTMLSize, "\tbody html size: ", bodyHTMLSize);

    if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
      countStableSizeIterations++;
    else
      countStableSizeIterations = 0; //reset the counter

    if (countStableSizeIterations >= minStableSizeIterations) {
      logger.log("Page rendered fully..");
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitForTimeout(checkDurationMsecs);
  }
};