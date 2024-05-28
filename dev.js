import fs from "fs";
import http from "http";
import mime from "mime-types";

await import("./build.js");

const handler = (req, res) => {
    const path = req.url === "/" ? "/index.html" : req.url;

    const filePath = "dist" + path;
    if(fs.existsSync(filePath)){
        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
            "Content-Type": mime.lookup(filePath),
            "Content-Length": content.byteLength,
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin"
        })
        res.end(content);
        return;
    }
}

http.createServer(handler).listen(8080);
console.log("http://localhost:8080")