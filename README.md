# file crawler.js:
## **crawl(...url)**: 
- lấy link từ hàng đợi và mở trang web từ link
- lấy dữ liệu từ trang web
- tìm các đường link từ trang web đó và đưa vào hàng đợi
## **handleData(url, title, content)**: 
- lưu dữ liệu đã crawl vào file
## **waitTillHTMLRendered(page, timeout = 30000)**:
- chờ trang web load nội dung, để việc lấy dữ liệu đầy đủ hơn
## **isValidUrl(urlString)**:
- kiểm tra xem url có hợp lệ không
