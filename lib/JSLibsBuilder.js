import { Task, Tasker } from "ab-tasks";
import { abTSValidator } from "@allblue/ab-ts-parser";
import abTSParser from "@allblue/ab-ts-parser/lib/abTSParser.js";
import path from "node:path";
import fs from "node:fs";
import abFS from "ab-fs";
import tsBlankSpace from "ts-blank-space";
import jsLibsParser from "./jsLibsParser.js";
                                                 

export default class JSLibsBuilder {
    #validationTasker        ;
    #validationTasks                                                                      ;


    constructor() {
        this.#validationTasker = new Tasker(150);
        this.#validationTasks = {};
    }

    async buildScript_Async(projectFSPath        , libName        , libFSPath        , scriptFSPath        , 
            buildFSPath        , tsconfigFSPath             , sourceMap         )  
                                 {
        return new Promise((resolve, reject) => {
            let scriptRelPath = path.relative(libFSPath, scriptFSPath);

            let destFSPath = path.join(buildFSPath, scriptRelPath);
            let destFSPath_Parsed = path.parse(destFSPath);
            destFSPath = path.join(destFSPath_Parsed.dir, destFSPath_Parsed.name) + 
                    ".js";
            destFSPath_Parsed = path.parse(destFSPath);
        
            /* Build File */
            let builtDirFSPath = path.dirname(destFSPath);
            if (!fs.existsSync(builtDirFSPath))
                abFS.mkdirRecursiveSync(buildFSPath);

            let exportDefines                = [];

            let data = fs.readFileSync(scriptFSPath).toString();

            let scriptErrors = abTSValidator.validateData(projectFSPath,
                    scriptFSPath, path.relative(libFSPath, scriptFSPath), data);
            data = tsBlankSpace(data);
            // data = abTSParser.parseData(data);
            data = jsLibsParser.parseData(libName, libFSPath, scriptFSPath, data, 
                    exportDefines, scriptErrors);
            /* / Build File */

            let exportPath_Parsed = path.parse(scriptRelPath);
            let exportPath = ("." + 
                    (exportPath_Parsed.dir === "" ? "" : `/${exportPath_Parsed.dir}`) + 
                    "/" + exportPath_Parsed.name).replaceAll("\\", "/");

            let exportDefines_Escaped = []
            for (let exportDefine of exportDefines)
                exportDefines_Escaped.push(`"${exportDefine}"`);
            
            data = `jsLibs.exportScript("${libName}", "${exportPath}"` +
                    `, [ ` + exportDefines_Escaped.join(",") + ` ], (_jsLib) => { "use strict"; ` +
                    data +
                    ` });`;

            if (sourceMap)
                data += `\r\n\r\n//# sourceMappingURL=./${destFSPath_Parsed.base}.map`;

            if (!fs.existsSync(destFSPath_Parsed.dir))
                abFS.mkdirRecursiveSync(destFSPath_Parsed.dir);
            fs.writeFileSync(destFSPath, data);

            if (sourceMap) {
                fs.writeFileSync(`${destFSPath}.map`, this.#getMapContent(
                        destFSPath_Parsed.base, path.relative(destFSPath_Parsed.dir, 
                        scriptFSPath), data));
            }

            if (tsconfigFSPath === null) {
                resolve({
                    scriptFSPath: destFSPath,
                    scriptErrors: scriptErrors,
                    validationErrors: [],
                });
            } else {
                let validationTask = this.#validationTasks[tsconfigFSPath];
                if (validationTask === undefined) {
                    validationTask = this.#createValidationTask(projectFSPath,
                            tsconfigFSPath);
                    this.#validationTasks[tsconfigFSPath] = validationTask;
                }
                this.#validationTasker.call(validationTask, (validationErrors) => {
                    resolve({
                        scriptFSPath: destFSPath,
                        scriptErrors: scriptErrors,
                        validationErrors: validationErrors,
                    });
                });
            }
        });
    }

    removeScript(libFSPath        , scriptFSPath        , buildFSPath        )       {
         let scriptRelPath = path.relative(libFSPath, scriptFSPath);

        let destFSPath = path.join(buildFSPath, scriptRelPath);
        let destFSPath_Parsed = path.parse(destFSPath);
        destFSPath = path.join(destFSPath_Parsed.dir, destFSPath_Parsed.name) + 
                ".js";
        destFSPath_Parsed = path.parse(destFSPath);
    }

    async validateTSConfig_Async(projectFSPath        , tsconfigFSPath        )  
                                   {
        return new Promise((resolve, reject) => {
            let validationTask = this.#validationTasks[tsconfigFSPath];
            if (validationTask === undefined) {
                validationTask = this.#createValidationTask(projectFSPath, 
                        tsconfigFSPath);
                this.#validationTasks[tsconfigFSPath] = validationTask;
            }

            this.#validationTasker.call(validationTask, (validationErrors) => {
                resolve(validationErrors);
            });
        })
    }

    #createValidationTask(projectFSPath        , tsconfigFSPath        )  
                                                            {
        return new Task(`validationTasks.${tsconfigFSPath}`, async (argsArr) => {
            let validationErrors = await abTSValidator.validateTSConfig_Async(
                    projectFSPath, tsconfigFSPath);

            for (let i = 0; i < argsArr.length - 1; i++)
                argsArr[i]([]);
            argsArr[argsArr.length - 1](validationErrors);

            return true;
        });
    }

    #getMapContent(scriptName        , scriptSourcePath        , data        )         {
        let mappings = "AAAA";
        let data_Arr = data.split("\r\n");
        for (let i = 0; i < data_Arr.length - 1; i++)
            mappings += ";AACA";

        let content = `{
  "version" : 3,
  "file": "${scriptName}",
  "sourceRoot": "",
  "sources": ["${scriptSourcePath.replaceAll("\\", "/")}"],
  "sourcesContent": [null],
  "names": [],
  "mappings": "${mappings}",
  "ignoreList": []
}`
        ;

        return content;
    }
}