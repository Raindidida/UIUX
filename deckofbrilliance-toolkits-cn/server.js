const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const rootPath = path.resolve(root);
const port = Number(process.env.PORT || 4177);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const pathname = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = path.resolve(path.join(root, pathname));

    if (!filePath.startsWith(rootPath)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const candidates = pathname.endsWith("/")
      ? [path.join(filePath, "index.html")]
      : [filePath, path.join(filePath, "index.html")];

    function readCandidate(index) {
      const targetPath = candidates[index];
      fs.readFile(targetPath, (error, data) => {
        if (error) {
          if (index + 1 < candidates.length) {
            readCandidate(index + 1);
            return;
          }
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        res.writeHead(200, {
          "Content-Type": types[path.extname(targetPath)] || "application/octet-stream",
        });
        res.end(data);
      });
    }

    readCandidate(0);
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`http://127.0.0.1:${port}`);
  });
