import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const websiteDirectory = join(fileURLToPath(new URL(".", import.meta.url)), "website");
const contentTypes = {
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".webmanifest": "application/manifest+json",
};

export default function handler(request, response) {
	const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
	const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
	const filePath = normalize(join(websiteDirectory, relativePath));

	if (!filePath.startsWith(websiteDirectory) || !existsSync(filePath) || !statSync(filePath).isFile()) {
		response.statusCode = 404;
		response.end("Not found");
		return;
	}

	response.setHeader("Content-Type", contentTypes[extname(filePath)] ?? "application/octet-stream");
	createReadStream(filePath).pipe(response);
}
