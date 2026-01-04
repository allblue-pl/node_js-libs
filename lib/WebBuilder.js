'use strict';

const fs = require('fs');
const path = require('path');

const abFS = require('ab-fs');


class WebBuilder
{

    constructor(jsLibName, jsLibPath, buildPath) {
        this.jsLib_Name = jsLibName;
        this.jsLib_Path = jsLibPath;
        this.build_Path = buildPath;

        this._parsers = [];
    }

    addParser(parser) {
        this._parsers.push(parser);
    }

    build(callback) {
        if (!this._createBuildPath(callback))
            return;

        abFS.matcher.getPaths([ this.jsLib_Path + '/**/*.js' ],
                (err, filePaths) => {
            if (err !== null) {
                callback(err);
                return;
            }

            let buildFilePromises = [];
            let builtFilePaths = [];
            for (let i = 0; i < filePaths.length; i++) {
                buildFilePromises.push(this._build_File_Promise(filePaths[i],
                        builtFilePaths));
            }

            Promise.all(buildFilePromises)
                .catch((err) => {
                    callback(err, null);
                })
                .then(() => {
                    callback(null, builtFilePaths);
                });
        });
    }

    buildScript(filePath, callback) {
        if (!this._createBuildPath(callback))
            return;

        let builtFilePaths = [];
        this._build_File_Promise(filePath, builtFilePaths)
            .catch((err) => {
                callback(err, null);
            })
            .then(() => {
                callback(null, builtFilePaths[0]);
            });
    }


    _build_File_Promise(filePath, builtFilePaths) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err !== null) {
                    reject(err);
                    return;
                }

                let basename = path.basename(filePath);
                let relativePath = path.relative(path.resolve(
                        this.jsLib_Path), filePath);
                let builtFilePath = path.join(this.build_Path, relativePath);
                let builtDirPath = path.dirname(builtFilePath);

                if (!abFS.dir.existsSync(builtDirPath))
                    abFS.dir.createRecursiveSync(builtDirPath);

                let module_path = this._parseModulePath(
                        relativePath === 'index.js' ?
                        'index.js' :
                        (basename === 'index.js' ?
                        path.dirname(relativePath) + '/index.js' :
                        path.dirname(relativePath) + '/' +
                        path.parse(relativePath).base));

                data = this._parseData(data);

                data = 'jsLibs.exportModule(' +
                        '\'' + this.jsLib_Name + '\'' +
                        ', \'' + module_path + '\'' +
                        ', (require, module, exports) => { ' +
                        data +
                        ' });';

                for (let parser of this._parsers)
                    data = parser(data, filePath, builtFilePath);

                fs.writeFile(builtFilePath, data, 'utf-8',
                        (err) => {
                    if (err !== null) {
                        reject(err);
                        return;
                    }

                    builtFilePaths.push(builtFilePath);
                    resolve();
                });
            });
        });
        //console.log(path.relative(this.jsLib_Path, filePath));
    }

    _createBuildPath(callback) {
        try {
            if (!fs.existsSync(this.build_Path))
                abFS.mkdirRecursiveSync(this.build_Path);
        } catch (err) {
            callback(err);
            return false;
        }

        return true;
    }

    _parseData(data) {
        let regexp = null;
        let exports = '';
        
        /* import from modules */
        regexp = /(^|\n)import\s+([$_a-zA-Z0-9]*)\s+from\s+('|")([_\-a-zA-Z0-9]+)('|")/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;
        }
        data = data.replace(regexp, `const $2 = require('$4')`);
        /* / import from modules */

        /* import from local */
        regexp = /(^|\n)import\s+([$_a-zA-Z0-9]*)\s+from\s+('|")([_\-/\\.\$a-zA-Z0-9]+?)('|")/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;
        }
        data = data.replace(regexp, `const $2 = require('$4')`);
        /* / import from local */

        /* export default */
        exports = '';
        regexp = /(^|\n)export\s+default\s+(class|function|async\s+function)\s+([$_a-zA-Z0-9]*)/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;

            exports += `module.exports = ${match[3]};\r\nexports = module.exports;\r\n`;    
        }
        data = data.replace(regexp, '$1$2 $3');
        data += `\r\n\r\n${exports}`;
        /* / export default */

        
        /* / export default = *//* export default = */
        exports = '';
        regexp = /(^|\n)export\s+default\s+([$_a-zA-Z0-9]*)\s+=/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;

            exports += `module.exports = ${match[2]};\r\n`;    
        }
        data = data.replace(regexp, '$1const $2 =');
        data += `\r\n\r\n${exports}`;

        /* export */
        exports = '';
        regexp = /(^|\n)export\s+(class|const|let|function|async\s+function)\s+([$_a-zA-Z0-9]*)/g;
        while(true) {
            let match = regexp.exec(data);
            if (match === null)
                break;

            exports += `module.exports.${match[3]} = ${match[3]};\r\n`;    
        }
        data = data.replace(regexp, '$1$2 $3');
        data += `\r\n\r\n${exports}`;
        /* / export */

        return data;
    }

    _parseModulePath(module_path) {
        module_path = module_path.replace(/\\/g, '/');

        if (module_path.indexOf('./') === 0)
            return module_path.substring(2);

        return module_path;
    }

}

module.exports = WebBuilder;
