const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "dist");
http
  .createServer((req, res) => {
    let url;
    try {
      url = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    const file = path.join(root, url === "/" ? "index.html" : url);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html; charset=utf-8",
          ".css": "text/css",
          ".js": "text/javascript",
          ".png": "image/png",
          ".jpg": "image/jpeg",
        }[path.extname(file)] || "application/octet-stream",
      );
      res.end(data);
    });
  })
  .listen(8080, "127.0.0.1", () =>
    console.log("Preview: http://127.0.0.1:8080"),
  );
