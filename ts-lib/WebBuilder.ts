// import fs from "fs";
// import path from "path";

// import abFS, { abFSMatcher } from "ab-fs";
// import tsBlankSpace from "ts-blank-space";

// import type { BuildCallback, Parser } from "./ts-types.ts";

// export default class TSWebBuilder {
//     #name: string;
//     #path: string;
//     #path_Build: string;

//     #parsers: Array<Parser>;


//     constructor(name: string, path: string, buildPath: string) {
//         this.#name = name;
//         this.#path = path;
//         this.#path_Build = buildPath;

//         this.#parsers = [];
//     }

//     addParser(parser: Parser): void {
//         this.#parsers.push(parser);
//     }

//     async buildPkg_Async(errors: Array<string>): Promise<Array<string>> {
//         this.#createBuildPath();

//         let filePaths = await abFSMatcher.getPaths_Async([ 
//                 this.#path + '/index.js',
//                 this.#path + '/js-lib/**/*.js',
//                 this.#path + '/index.ts',
//                 this.#path + '/ts-lib/**/*.ts',
//         ]);

//         let builtFilePaths: Array<string> = [];
//         for (let i = 0; i < filePaths.length; i++) {
//             if (filePaths[i].lastIndexOf(".d.ts") === filePaths[i].length - 5)
//                 continue;
//             this.#build_File(filePaths[i], builtFilePaths, errors);
//         }

//         return builtFilePaths;
//     }

//     async buildScript_Async(libFSPath: string, buildFSPath: string, scriptFSPath: string, 
//             errors: Array<string>): Promise<string> {
//         this.#createBuildPath();

//         let builtFilePaths: Array<string> = [];
//         this.#build_File(fsPath, builtFilePaths, errors);

//         return builtFilePaths[0];
//     }


//     #build_File(fsPath: string, builtFilePaths: Array<string>, 
//             errors: Array<string>): void {
//         let data = fs.readFileSync(fsPath, "utf-8");

//         let basename = path.basename(fsPath);
//         let ext = path.extname(fsPath);
//         let relativePath = path.relative(path.resolve(
//                 this.#path), fsPath);
//         let builtFilePath = path.join(this.#path_Build, relativePath);
//         let builtDirPath = path.dirname(builtFilePath);

//         if (!abFS.dir.existsSync(builtDirPath))
//             abFS.dir.createRecursiveSync(builtDirPath);

//         let scriptPath = this.#parseModulePath(
//                 relativePath === `index${ext}` ?
//                 `index${ext}` :
//                 (basename === `index${ext}` ?
//                 path.dirname(relativePath) + `/index${ext}` :
//                 path.dirname(relativePath) + '/' +
//                 path.parse(relativePath).base));

//         abTSValidator.validateData(fsPath, scriptPath, data, errors);

//         if (ext === '.ts') {
//             builtFilePath = builtFilePath.substring(0, builtFilePath.length - 3) +
//                     ".js";
//             data = tsBlankSpace(data);
//         }

//         let exportDefines: Array<string> = [];
//         data = abJSLibsParser.parseData(fsPath, scriptPath, data, exportDefines, 
//                 errors);

//         for (let i = 0; i < exportDefines.length; i++)
//             exportDefines[i] = `"${exportDefines[i]}"`;

//         let exportPath_Parsed = path.parse(scriptPath);
//         let exportPath = "." + 
//                 (exportPath_Parsed.dir === "" ? "" : `/${exportPath_Parsed.dir}`) + 
//                 "/" + exportPath_Parsed.name;
//         data = 'jsLibs.exportScript(' +
//                 '\'' + this.#name + '\'' +
//                 ', \'' + exportPath + '\'' +
//                 ', [ ' + exportDefines.join(",") + ' ]' +
//                 ', (_jsLib) => { ' +
//                 data +
//                 ' });';

//         for (let parser of this.#parsers)
//             data = parser(data, fsPath, builtFilePath);

//         fs.writeFileSync(builtFilePath, data, 'utf-8');
//         builtFilePaths.push(builtFilePath);
//     }

//     #createBuildPath(): void {
//         if (!fs.existsSync(this.#path_Build))
//             abFS.mkdirRecursiveSync(this.#path_Build);
//     }

//     #parseModulePath(modulePath: string): string {
//         modulePath = modulePath.replace(/\\/g, '/');

//         if (modulePath.indexOf('./') === 0)
//             return modulePath.substring(2);

//         return modulePath;
//     }

// }
