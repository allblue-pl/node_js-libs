import fs from "fs";
import path from "path";

import abFS, { abFSMatcher } from "ab-fs";
import tsBlankSpace from "ts-blank-space";

import type { BuildCallback, Parser } from "./ts-types.ts";

export default class WebBuilder {
    #name: string;
    #path: string;
    #path_Build: string;

    #parsers: Array<Parser>;

    constructor(name: string, path: string, buildPath: string) {
        this.#name = name;
        this.#path = path;
        this.#path_Build = buildPath;

        this.#parsers = [];
    }

    addParser(parser: Parser): void {
        this.#parsers.push(parser);
    }

    async buildLib_Async(parseTS: boolean): Promise<Array<string>> {
        this.#createBuildPath();

        let filePaths = await abFSMatcher.getPaths_Async([ this.#path + 
                '/**/*.js' ]);

        let buildFilePromises: Array<Promise<void>> = [];
        let builtFilePaths: Array<string> = [];
        for (let i = 0; i < filePaths.length; i++) {
            buildFilePromises.push(this.#build_File_Async(filePaths[i],
                    builtFilePaths, parseTS));
        }

        await Promise.all(buildFilePromises);

        return builtFilePaths;
    }

    async buildPkg_Async(parseTS: boolean): Promise<Array<string>> {
        this.#createBuildPath();

        let filePaths = await abFSMatcher.getPaths_Async([ this.#path + 
                (parseTS ? '/**/*.js' : '/**/*.ts') ]);

        let buildFilePromises: Array<Promise<void>> = [];
        let builtFilePaths: Array<string> = [];
        for (let i = 0; i < filePaths.length; i++) {
            buildFilePromises.push(this.#build_File_Async(filePaths[i],
                    builtFilePaths, parseTS));
        }

        await Promise.all(buildFilePromises);

        return builtFilePaths;
    }

    async buildScript_Async(filePath: string, parseTS: boolean): Promise<string> {
        this.#createBuildPath();

        let builtFilePaths: Array<string> = [];
        await this.#build_File_Async(filePath, builtFilePaths, parseTS);

        return builtFilePaths[0];
    }


    async #build_File_Async(filePath: string, builtFilePaths: Array<string>,
            parseTS: boolean): Promise<void> {
        let data = fs.readFileSync(filePath, "utf-8");

        let basename = path.basename(filePath);
        let relativePath = path.relative(path.resolve(
                this.#path), filePath);
        let builtFilePath = path.join(this.#path_Build, relativePath);
        let builtDirPath = path.dirname(builtFilePath);

        if (!abFS.dir.existsSync(builtDirPath))
            abFS.dir.createRecursiveSync(builtDirPath);

        let modulePath = this.#parseModulePath(
                relativePath === 'index.js' ?
                'index.js' :
                (basename === 'index.js' ?
                path.dirname(relativePath) + '/index.js' :
                path.dirname(relativePath) + '/' +
                path.parse(relativePath).base));

        // console.log('TS', parseTS, path.extname(modulePath));
        if (parseTS && (path.extname(modulePath) === '.ts')) {
            builtFilePath = builtFilePath.substring(0, builtFilePath.length - 3) +
                    ".js";
            data = tsBlankSpace(data);
        }

        data = this.#parseData(data);

        data = 'jsLibs.exportModule(' +
                '\'' + this.#name + '\'' +
                ', \'' + modulePath + '\'' +
                ', (require, module, exports) => { ' +
                data +
                ' });';

        for (let parser of this.#parsers)
            data = parser(data, filePath, builtFilePath);

        fs.writeFileSync(builtFilePath, data, 'utf-8');
        builtFilePaths.push(builtFilePath);
    }

    #createBuildPath(): void {
        if (!fs.existsSync(this.#path_Build))
            abFS.mkdirRecursiveSync(this.#path_Build);
    }

    #parseData(data: string) {
        let regexp = null;
        let exports = '';
        
        /* import from modules */
        regexp = /(^|\n)import\s+([$_a-zA-Z0-9]*)\s+from\s+('|")([_\-a-zA-Z0-9]+)('|")/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;
        }
        data = data.replace(regexp, `const $2 = require("$4")`);
        /* / import from modules */

        /* import from local */
        regexp = /(^|\n)import\s+([$_a-zA-Z0-9]*)\s+from\s+('|")([_\-/\\.\$a-zA-Z0-9]+?)('|")/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;
        }
        data = data.replace(regexp, `const $2 = require("$4")`);
        /* / import from local */

        /* / export default = */
        exports = '';
        regexp = /(^|\n)export\s+default\s+([$_a-zA-Z0-9]*)\s+=/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;

            exports += `module.exports = ${match[2]};\r\n`;    
        }
        data = data.replace(regexp, '$1/* export default $2; */ const $2 =');
        data += `${exports}`;
        /* / export default = */

        /* export default */
        exports = '';
        regexp = /(^|\n)export\s+default\s+(class|function|async\s+function)\s+([$_a-zA-Z0-9]*)/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;

            exports += `module.exports = ${match[3]};\r\nexports = module.exports;\r\n`;    
        }
        data = data.replace(regexp, '$1/* export default $2; */ $2 $3');
        data += `${exports}`;
        /* / export default */

        /* / export default [const] */
        exports = '';
        regexp = /(^|\n)export\s+default\s+([$_a-zA-Z0-9]*);?/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;

            exports += `module.exports = ${match[2]};\r\n`;    
        }
        data = data.replace(regexp, '$1/* export default $2; */ const $2');
        data += `\r\n${exports}`;
        /* / export default [const] */

        /* export */
        exports = '';
        regexp = /(^|\n)export\s+(class|const|let|function|async\s+function)\s+([$_a-zA-Z0-9]*)/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;

            exports += `module.exports.${match[3]} = ${match[3]};\r\n`;    
        }
        data = data.replace(regexp, '$1/* export default $2; */ $2 $3');
        data += `${exports}`;
        /* / export */

        return data;
    }

    #parseModulePath(modulePath: string): string {
        modulePath = modulePath.replace(/\\/g, '/');

        if (modulePath.indexOf('./') === 0)
            return modulePath.substring(2);

        return modulePath;
    }

}
