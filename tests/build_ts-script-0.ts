import path from "node:path";
import { fileURLToPath } from "node:url";

import jsLib from "../ts-lib/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    await jsLib.buildScript_Async("ts-script-0", 
            path.join(__dirname, "./ts-script-0"),
            path.join(__dirname, "./build"), 
            path.join(__dirname, "./ts-script-0/test-script.ts"),
            true);
        })()
    .then(() => {
        console.log('Done.');
    })
    .catch((err) => {
        console.error("Error:", err);
    });