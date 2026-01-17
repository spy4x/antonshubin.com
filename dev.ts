#!/usr/bin/env -S deno run -A --watch=static/,routes/

import { app } from "./main.ts";

await app.listen();
