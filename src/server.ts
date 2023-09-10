// Start listening on port 8080 of localhost.
const server = Deno.listen({ port: 8080 });
console.log("File server running on http://localhost:8080/");

for await (const conn of server) {
  handleHttp(conn).catch(console.error);
}

async function handleHttp(conn: Deno.Conn) {
  const mimes = {
    js: "text/javascript",
    css: "text/css",
    html: "text/html",
  }

  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    // Use the request pathname as filepath
    const url = new URL(requestEvent.request.url);
    const filepath = decodeURIComponent(url.pathname);

    // Try opening the file
    let file;
    try {
      file = await Deno.open("./src/freecell" + filepath, { read: true });
    } catch {
      // If the file cannot be opened, return a "404 Not Found" response
      const notFoundResponse = new Response("404 Not Found", { status: 404 });
      await requestEvent.respondWith(notFoundResponse);
      console.log(requestEvent.request.method, filepath, 404)
      continue;
    }

    // Build a readable stream so the file doesn't have to be fully loaded into
    // memory while we send it
    const readableStream = file.readable;

    // Build and send the response
    const response = new Response(readableStream);

    const ext = filepath.split(".").slice(-1)[0]
    if (mimes[ext]) {
      response.headers.set("Content-Type", mimes[ext])
    }
    await requestEvent.respondWith(response);
    console.log(requestEvent.request.method, filepath, 200)
  }
}
