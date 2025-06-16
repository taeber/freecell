#!/usr/bin/env -S deno serve --allow-net --allow-read=. --port=8080 --watch

const mimes = {
  js: "text/javascript",
  css: "text/css",
  html: "text/html",
};

export default {
  async fetch(request: Request) {
    // Use the request pathname as filepath
    const url = new URL(request.url);
    const filepath = decodeURIComponent(url.pathname);

    if (filepath === "/") {
      const redirectResponse = new Response("301 Moved Permanently", {
        status: 301,
        headers: {
          Location: "/index.html",
        },
      });
      console.log(request.method, filepath, 308);
      return redirectResponse;
    }

    // Try opening the file
    let file;
    try {
      file = await Deno.open("./src/freecell" + filepath, { read: true });
    } catch {
      // If the file cannot be opened, return a "404 Not Found" response
      const notFoundResponse = new Response("404 Not Found", { status: 404 });
      console.log(request.method, filepath, 404);
      return notFoundResponse;
    }

    // Build a readable stream so the file doesn't have to be fully loaded into
    // memory while we send it
    const readableStream = file.readable;

    // Build and send the response
    const response = new Response(readableStream);

    const ext = filepath.split(".").slice(-1)[0] as keyof typeof mimes;
    if (mimes[ext]) {
      response.headers.set("Content-Type", mimes[ext]);
    }
    console.log(request.method, filepath, 200);
    return response;
  },
} satisfies Deno.ServeDefaultExport;
