const puppeteer = require('puppeteer');
const { insertPage } = require('./models/web');
const queueDB = require('./models/queue');
const logger = require('./utils/logger');
const processor = require('./utils/processor');

let numberOfPagesCrawled = 0;
let stopCrawling = false;
const stopCrawl = () => { stopCrawling = true; }

async function crawl(...urls) {
  // Đẩy link vào hàng đợi
  for (let url of urls) {
    await queueDB.pushQueue(url);
  }

  // Mở trình duyệt
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Khởi tạo tab trong trình duyệt
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  // const page = (await browser.pages())[0];

  // Bắt đầu quá trình crawl
  while (!stopCrawling) {
    // Lấy link từ hàng đợi
    let url = await queueDB.popQueue();
    if (url === undefined)
      break;

    // Mở url trong tab đã khởi tạo
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.goto(url, { timeout: 0, waitUntil: 'load' }),
      // page.waitForSelector('body'),
    ]);

    // Chờ trang web tải xong
    await waitTillHTMLRendered(page);

    // Xóa quảng cáo
    // await page.evaluate((sel) => {
    //   let elements = document.querySelectorAll(sel);
    //   for (let i = 0; i < elements.length; i++) {
    //     elements[i].parentNode.removeChild(elements[i]);
    //   }
    // }, "iframe");

    // Lấy dữ liệu từ trang web (đường link, tên trang, nội dung trang)
    const canonical = await page.$('link[rel=canonical]')?.href;
    const pageUrl = canonical || page.url();
    const title = await page.title();
    // const content = await page.$eval('*', (el) => el.innerText);
    const content = await page.$eval('*', (el) => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNode(el);
      selection.removeAllRanges();
      selection.addRange(range);
      return window.getSelection().toString();
    });

    // Đưa dữ liệu đã crawl vào database
    await handleData(pageUrl, title, content);
    numberOfPagesCrawled++;
    logger.log("Number of pages crawled: ", numberOfPagesCrawled);

    // Lấy các link từ trang web đang truy cập
    const pageUrls = await page.evaluate(() => {
      const urlArray = Array.from(document.links).map((link) => link.href);
      const uniqueUrlArray = [...new Set(urlArray)];
      return uniqueUrlArray;
    });

    // Đưa các link vào hàng đợi
    pageUrls.forEach(async (url) => {
      if (isValidUrl(url))
        await queueDB.pushQueue(url);
    });

    global.gc();
  }

  await browser.close();
};

async function handleData(url, title, content) {
  if (!url && !title && !content) {
    return;
  }

  const processedContent = processor.preProcess(content);

  await insertPage(url, title, processedContent);
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

function isValidUrl(urlString) {
  var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
  return !!urlPattern.test(urlString);
}

module.exports = crawl;
module.exports.stopCrawl = stopCrawl;