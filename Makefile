.POSIX:

.PHONY: run
run:
	deno run --watch --allow-read=. --allow-net src/server.ts

