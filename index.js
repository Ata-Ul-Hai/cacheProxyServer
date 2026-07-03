import { ClearCache } from "./cache.js";
import proxyServer from "./server.js"
import fs from 'fs/promises'
import path from 'path';

const args = process.argv.slice(2)
const dir = await fs.mkdir('.cache', { recursive: true })

if (args.includes('--clear-cache')){
        // clear cache
        await ClearCache()
        console.log('Cache Cleared!');
        process.exit(0)
    }

let PORT;
let originStr;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port') PORT = parseInt(args[i + 1], 10);
    if (args[i] === '--origin') originStr = args[i + 1];
}

if (!PORT || !originStr) {
    console.error('❌ Error: Missing --port or --origin arguments.');
    process.exit(1);
}

const myURL = new URL(originStr);

proxyServer(PORT, myURL)