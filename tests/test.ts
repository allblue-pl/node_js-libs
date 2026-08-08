import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import jsLibsParser from "../ts-lib/jsLibsParser.ts";
import tsBlankSpace from "ts-blank-space";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let data = fs.readFileSync("./src/a.ts").toString();

let exportDefines: Array<string> = [];
let errors: Array<string> = [];

data = tsBlankSpace(data);
data = jsLibsParser.parseData("test", "./src", "./src/a.test.ts", data, exportDefines, errors);

fs.writeFileSync("./out/a.js", data);

// console.log(data);

// console.log(exportDefines);

// console.log(errors);