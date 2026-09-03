import path from "node:path";
import { ClassDeclaration, FunctionDeclaration, GetAccessorDeclaration, 
        Identifier, ImportDeclaration, InterfaceDeclaration, MethodDeclaration, 
        Node, Project, ReferencedSymbol, SourceFile, TypeAliasDeclaration, 
        VariableDeclaration } from "ts-morph";
import ts from "typescript";
                                                  

export class jsLibsParser_Class {
    constructor() {

    }

    parseData(libName        , libFSPath        , scriptFSPath        , data        , 
            exportDefines               , errors               )         {
        let project = new Project();
        let sourceFile = project.createSourceFile("source.ts", data);

        data = this.#parseData_Modificators(data);
        data = this.#parseData_AddJSLibsExports(scriptFSPath, sourceFile, data, 
                exportDefines, errors);

        project = new Project();
        sourceFile = project.createSourceFile("source.ts", data);
        data = this.#parseData_ReplaceImports(libName, libFSPath, scriptFSPath,
                sourceFile, data, errors);

        data = this.#parseData_RemoveExports(data);

        return data;
    }


    #getImportPath(rawImportPath        )         {
        let importPath = rawImportPath.replace(/'|"/g, "");

        return importPath;
        // let importPath_Parsed = path.parse(importPath);

        // return (importPath_Parsed.dir === "" ? "" : `${importPath_Parsed.dir}/`) + 
        //         importPath_Parsed.name + ".js";
    }

    #parseData_AddJSLibsExports(scriptFSPath        , sourceFile            , 
            data        , exportDefines               , 
            errors               )         {
        let exports = new Map();

        let exportDeclarations = sourceFile.getExportDeclarations();
        for (let exportDeclaration of exportDeclarations) {
            let namedExports = exportDeclaration.getNamedExports();
            for (let namedExport of namedExports) {
                let namedExportSymbol = namedExport.getSymbol();
                if (namedExportSymbol === undefined)
                    exports.set(namedExport.getName(), namedExport.getName());
                else
                    exports.set(namedExportSymbol.getName(), namedExport.getName());
            }
        }

        let exportedDeclarations = sourceFile.getExportedDeclarations();
        for (let [ exportDeclarationName, exportDeclarations ] of exportedDeclarations) {
            if (exportDeclarations.length === 0) {
                if (exportDeclarationName === "default") {
                    let r = /(^|\r\n)([ \t])*export([ \t])*(default([ \t])*)(.+?)(;|(\r\n))/gm;
                    let m = null;
                    let m_New = null;
                    do {
                        let m_New = r.exec(data);
                        if (m_New === null)
                            break;
                        m = m_New;
                    } while(m_New !== null)

                    if (m === null) {
                        errors.push(`Error in ${scriptFSPath}:0:0\r\n` +
                                `Cannot parse default export: \r\n` + data);
                        continue;
                    }

                    exports.set("default", m[6]);
                } else if (!exports.has(exportDeclarationName)) {
                    errors.push(`Error in ${scriptFSPath}:0:0\r\n` +
                                `Cannot parse export '${exportDeclarationName}'.`);
                }
            } else {
                for (let declaration of exportDeclarations) {
                    if (declaration instanceof InterfaceDeclaration || 
                            declaration instanceof TypeAliasDeclaration)
                        continue;

                    if (!(declaration instanceof ClassDeclaration || 
                            declaration instanceof FunctionDeclaration ||
                            declaration instanceof VariableDeclaration)) {
                        errors.push(`Error in ${scriptFSPath}:${declaration.getStartLineNumber()}` +
                                `:${declaration.getStart() - declaration.getStartLinePos()}\r\n` +
                                `Export type '${declaration.getKindName()}' not supported.`);
                        continue;
                    }

                    let declarationName = declaration.getName();
                    exports.set(exportDeclarationName, declarationName);
                }
            }
        }

        data += "\r\n\r\n/* JSLib Exports */";
        for (let [ exportName, exportVal ] of exports) {
            exportDefines.push(exportName);
            data += `\r\n_jsLib.export("${exportName}", ${exportVal});`;
        }

        return data;
    }

    #parseData_Modificators(data        )         {
        let dataArr = data.split("\r\n");
        for (let i = 0; i < dataArr.length; i++) {
            if (!dataArr[i].match(/\/\* *@ab-ignore *\*\//))
                continue;

            dataArr[i + 1] = `/* ${dataArr[i + 1]} */`;
        }

        return dataArr.join("\r\n");
    }

    #parseData_RemoveExports(data        )         {
        // let r1 = /(^|(\r\n))([ \t]*)export([ \t]*)\{([ \t]*)(.+?)([ \t]*)\}([ \t]*)?(;)/gs;
        // let replaces = [];
        // while (true) {
        //     let match = r1.exec(data);
        //     if (match === null)
        //         break;

        //     replaces.push([ match[0], `${match[1]}/* ${match[3]}export${match[4]}{${match[5]}${match[6]}${match[7]}}${match[8]}${match[9]} */`])
        // }

        // for (let replace of replaces) {
        //     for (let i = 0; i < replace[0].length; i++) {
        //         if (replace[0][i] === "\n")
        //             replace[1] += "\r\n";
        //     }
        //     data.replace(replace[0], replace[1]);
        // }

        // replaces = [];
        // let r2 = /(^|(\r\n))([ \t]*)export([ \t]*)(default([ \t]*))?(.+?)(;)/gs;
        // while (true) {
        //     let match = r2.exec(data);
        //     if (match === null)
        //         break;

        //     replaces.push([ match[0], `${match[1]}/* ${match[3]}export${match[4]}${match[5]}*/ ${match[7]}${match[8]}` ]);
        // }
        // for (let replace of replaces) {
        //     for (let i = 0; i < replace[0].length; i++) {
        //         if (replace[0][i] === "\n")
        //             replace[1] += "\r\n";
        //     }
        //     data.replace(replace[0], replace[1]);
        // }

        data = data.replace(/(^|(\r\n))([ \t]*)export([ \t]*)\{([ \t]*)(.+?)([ \t]*)\}([ \t]*)?(;)/gs, 
                "$1/* $3export$4{$5$6$7}$8$9 */");
        data = data.replace(/(^|(\r\n))([ \t]*)export([ \t]*)(default([ \t]*))?(.+?)(;)/gs, 
                "$1/* $3export$4$5*/ $7$8");

        return data;
    }

    #parseData_ReplaceImports(libName        , libFSPath        , scriptFSPath        , 
            sourceFile            , data        , errors               )         {
        let declarationReplaces                          = {};
        let importReplaces                     = [];
        let importDeclarations = sourceFile.getImportDeclarations();
        for (let importDeclaration of importDeclarations) {
            let importedDefines                      = [];
            let sideEffectImport          = true;

            /* Namespace Import */
            let namespaceImport = importDeclaration.getNamespaceImport();
            if (namespaceImport !== undefined) {
                sideEffectImport = false;

                this.#parseData_ReplaceImports_FindReferences(libName, libFSPath, 
                        scriptFSPath, importDeclaration, sourceFile, "*", undefined, 
                        namespaceImport.findReferences(), declarationReplaces, 
                        importReplaces, importedDefines,
                        errors);
            }

            /* Default Import */
            let defaultImport = importDeclaration.getDefaultImport();
            if (defaultImport !== undefined) {
                sideEffectImport = false;

                this.#parseData_ReplaceImports_FindReferences(libName, libFSPath, 
                        scriptFSPath, importDeclaration, sourceFile, "default",
                        undefined, defaultImport.findReferences(), declarationReplaces,
                        importReplaces, importedDefines, errors);
            }

            /* Named Imports */
            let namedImports = importDeclaration.getNamedImports();
            for (let namedImport of namedImports) {
                sideEffectImport = false;

                let nameNode = namedImport.getNameNode();
                let aliasNode = namedImport.getAliasNode();
                this.#parseData_ReplaceImports_FindReferences(libName, libFSPath, 
                        scriptFSPath, importDeclaration, sourceFile, nameNode.getText(), 
                        aliasNode === undefined ? nameNode.getText() : aliasNode.getText(),
                        (nameNode              ).findReferences(), declarationReplaces, 
                        importReplaces, importedDefines, errors);
            }

            /* Import Declaration */
            let importPath = this.#getImportPath(importDeclaration
                    .getModuleSpecifier().getText());

            let importInfo = this.#resolveImportInfo(importDeclaration, 
                        libName, libFSPath, scriptFSPath, importPath, errors);

            let importedDefines_Parsed                = [];
            for (let i = 0; i < importedDefines.length; i++) {
                let importedDefine_Parsed = `{ name: "${importedDefines[i].name}"` +
                        `, alias: ` + (importedDefines[i].alias === null ? "null" : 
                        `"${importedDefines[i].alias}"`) + ` }`;
                if (!importedDefines_Parsed.includes(importedDefine_Parsed))
                    importedDefines_Parsed.push(importedDefine_Parsed);
            }

            if (sideEffectImport) {
                let newLinesCount = 0;
                let importDeclarationText = importDeclaration.getText();
                for (let i = 0; i < importDeclarationText.length; i++)
                    newLinesCount += importDeclarationText[i] === "\n" ? 1 : 0;

                importReplaces.push({
                    start: importDeclaration.getStart(),
                    length: importDeclaration.getText().length,
                    text: `_jsLib.import("${importInfo.pkgName}"` + 
                            `, "${importInfo.scriptPath}", null, null` +
                            `, "${importPath}");`,
                    newLinesCount: newLinesCount,
                });
            } else {
                let newLinesCount = 0;
                let importDeclarationText = importDeclaration.getText();
                for (let i = 0; i < importDeclarationText.length; i++)
                    newLinesCount += importDeclarationText[i] === "\n" ? 1 : 0;

                declarationReplaces[importDeclaration.getStart()] = {
                    start: importDeclaration.getStart(),
                    length: importDeclaration.getText().length,
                    text: `_jsLib.importDeclaration("${importInfo.pkgName}"` + 
                            `, "${importInfo.scriptPath}", [ ${importedDefines_Parsed.join(", ")} ]` +
                            `, "${importPath}");`,
                    newLinesCount: newLinesCount,
                };
            }

            if (importPath[importPath.length - 1] === ".") {
                errors.push(`Error in ${scriptFSPath}:${importDeclaration.getStartLineNumber()}` +
                        `:${importDeclaration.getStart() - importDeclaration.getStartLinePos()}\r\n` +
                        `Import path '${importPath}' not supported.`);
            }
        }

        let replaces_Sorted = [];
        for (let file in declarationReplaces)
            replaces_Sorted.push(declarationReplaces[file]);
        for (let replace of importReplaces)
            replaces_Sorted.push(replace);

        replaces_Sorted.sort((a, b) => {
            return b.start - a.start;
        });
        for (let i = 0; i < replaces_Sorted.length; i++) {
            let extraLines = "";
            for (let j = 0; j < replaces_Sorted[i].newLinesCount; j++)
                extraLines += "\r\n";

            data = data.substring(0, replaces_Sorted[i].start) + replaces_Sorted[i].text + 
                    extraLines + data.substring(replaces_Sorted[i].start + 
                    replaces_Sorted[i].length);
        }

        return data;
    }

    #parseData_ReplaceImports_FindReferences(libName        , libFSPath        , 
            scriptFSPath        , importDeclaration                   , 
            sourceFile            , importName        , aliasName                  , 
            importReferenceFinds                    , 
            declarationReplaces                         , importReplaces                    ,
            importedDefines                     , errors               )       {
        for (let importReferenceFind of importReferenceFinds) {
            let importReferences = importReferenceFind.getReferences();                
            for (let i = importReferences.length - 1; i >= 0; i--) {
                let importReference = importReferences[i];
                if (importReference.getSourceFile() !== sourceFile)
                    continue;

                let symbolText = importReference.getNode().getText();
                if (importReference.isDefinition() === true)
                    continue;

                let referenceNode = importReference.getNode();
                if (referenceNode.getStart() >= importDeclaration.getStart() &&
                        referenceNode.getStart() < importDeclaration.getStart() + 
                        importDeclaration.getText().length)
                    continue;

                let importPath = this.#getImportPath(importDeclaration
                        .getModuleSpecifier().getText());

                let importInfo = this.#resolveImportInfo(importReference.getNode(), 
                        libName, libFSPath, scriptFSPath, importPath, errors);

                // let importDeclarationText = importDeclaration.getText();
                // let newLinesCount = 0;
                // for (let i = 0; i < importDeclarationText.length; i++)
                //     newLinesCount += importDeclarationText[i] === "\n" ? 1 : 0;

                importedDefines.push({ 
                    name: importName, 
                    alias: symbolText,
                });

                importReplaces.push({
                    start: importReference.getNode().getStart(),
                    length: symbolText.length,
                    text: `(_jsLib.import("${importInfo.pkgName}"` +
                            `, "${importInfo.scriptPath}", "${importName}"` +
                            `, "${aliasName === undefined ? symbolText : aliasName}"` +
                            `, "${importPath}"))`,
                    newLinesCount: 0,
                });

                if (importPath[importPath.length - 1] === ".") {
                    errors.push(`Error in ${scriptFSPath}:${importDeclaration.getStartLineNumber()}` +
                            `:${importDeclaration.getStart() - importDeclaration.getStartLinePos()}\r\n` +
                            `Import path '${importPath}' not supported.`);
                }
            }
        }
    }

    #resolveImportInfo(importNode               , libName        , libFSPath        , 
            scriptFSPath        , importPath        , errors               )  
                                                   {
        if (importPath[0] === '/') {
            errors.push(`Error in ${scriptFSPath}:${importNode.getStartLineNumber()}` +
                    `:${importNode.getStart() - importNode.getStartLinePos()}\r\n` +
                    `Wrong import path format: '${importPath}'.`);
        }
        
        /* Import Module */
        let importPathArray = importPath.split('/');
        /* Import Package */
        if (importPathArray[0] !== '.' && importPathArray[0] !== '..') {
            return {
                pkgName: importPath,
                scriptPath: './index',
            };
        }

        let importPath_Parsed = path.parse(importPath);
        let scriptRelPath = path.relative(libFSPath, path.join(
                path.dirname(scriptFSPath), path.join(path.dirname(importPath),
                importPath_Parsed.name)));
        if (importPath_Parsed.ext !== ".js" && importPath_Parsed.ext !== ".ts")
            scriptRelPath += importPath_Parsed.ext;
            
        let scriptRelPath_Arr = scriptRelPath.split("/");
        if (scriptRelPath_Arr[0] !== '.' && scriptRelPath_Arr[0] !== '..')
            scriptRelPath = `./${scriptRelPath}`;

        return {
            pkgName: libName,
            scriptPath: scriptRelPath.replaceAll("\\", "/"),
        };
    }
}
const jsLibsParser = new jsLibsParser_Class();
export default jsLibsParser;

                    
                  
                    
                  
                          
  
                                                             
                                             