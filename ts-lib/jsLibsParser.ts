import path from "node:path";
import { ClassDeclaration, FunctionDeclaration, GetAccessorDeclaration, 
        Identifier, ImportDeclaration, InterfaceDeclaration, MethodDeclaration, 
        Node, Project, ReferencedSymbol, SourceFile, TypeAliasDeclaration, 
        VariableDeclaration } from "ts-morph";
import ts from "typescript";
import type { ImportDefine } from "./ts-types.ts";

export class jsLibsParser_Class {
    constructor() {

    }

    parseData(libName: string, libFSPath: string, scriptFSPath: string, data: string, 
            exportDefines: Array<string>, errors: Array<string>): string {
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


    #getImportPath(rawImportPath: string): string {
        let importPath = rawImportPath.replace(/'|"/g, "");

        return importPath;
        // let importPath_Parsed = path.parse(importPath);

        // return (importPath_Parsed.dir === "" ? "" : `${importPath_Parsed.dir}/`) + 
        //         importPath_Parsed.name + ".js";
    }

    #parseData_AddJSLibsExports(scriptFSPath: string, sourceFile: SourceFile, 
            data: string, exportDefines: Array<string>, 
            errors: Array<string>): string {
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

    #parseData_Modificators(data: string): string {
        let dataArr = data.split("\r\n");
        for (let i = 0; i < dataArr.length; i++) {
            if (!dataArr[i].match(/\/\* *@ab-ignore *\*\//))
                continue;

            dataArr[i + 1] = `/* ${dataArr[i + 1]} */`;
        }

        return dataArr.join("\r\n");
    }

    #parseData_RemoveExports(data: string): string {
        data = data.replace(/(^|(\r\n))([ \t]*)export([ \t]*)\{([ \t]*)(.+?)([ \t]*)\}([ \t]*)?(;)/gs, 
                "$1/* $3export$4{$5$6$7}$8$9 */");
        data = data.replace(/(^|(\r\n))([ \t]*)export([ \t]*)(default([ \t]*))?(.+?)(;)/gs, 
                "$1/* $3export$4$5*/ $7$8");
                
        return data;
    }

    #parseData_ReplaceImports(libName: string, libFSPath: string, scriptFSPath: string, 
            sourceFile: SourceFile, data: string, errors: Array<string>): string {
        let replaces: Array<{start: number, length: number, text: string}> = [];
        let importDeclarations = sourceFile.getImportDeclarations();
        for (let importDeclaration of importDeclarations) {
            let importedDefines: Array<ImportDefine> = [];
            let sideEffectImport: boolean = true;

            /* Namespace Import */
            let namespaceImport = importDeclaration.getNamespaceImport();
            if (namespaceImport !== undefined) {
                sideEffectImport = false;

                this.#parseData_ReplaceImports_FindReferences(libName, libFSPath, 
                        scriptFSPath, importDeclaration, sourceFile, "*", undefined, 
                        namespaceImport.findReferences(), replaces, importedDefines,
                        errors);
            }

            /* Default Import */
            let defaultImport = importDeclaration.getDefaultImport();
            if (defaultImport !== undefined) {
                sideEffectImport = false;

                this.#parseData_ReplaceImports_FindReferences(libName, libFSPath, 
                        scriptFSPath, importDeclaration, sourceFile, "default",
                        undefined, defaultImport.findReferences(), replaces,
                        importedDefines, errors);
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
                        (nameNode as Identifier).findReferences(), replaces, importedDefines, 
                        errors);
            }

            /* Import Declaration */
            let importPath = this.#getImportPath(importDeclaration
                    .getModuleSpecifier().getText());

            let importInfo = this.#resolveImportInfo(importDeclaration, 
                        libName, libFSPath, scriptFSPath, importPath, errors);

            let importedDefines_Parsed: Array<string> = [];
            for (let i = 0; i < importedDefines.length; i++) {
                let importedDefine_Parsed = `{ name: "${importedDefines[i].name}"` +
                        `, alias: ` + (importedDefines[i].alias === null ? "null" : 
                        `"${importedDefines[i].alias}"`) + ` }`;
                if (!importedDefines_Parsed.includes(importedDefine_Parsed))
                    importedDefines_Parsed.push(importedDefine_Parsed);
            }

            if (sideEffectImport) {
                replaces.push({
                    start: importDeclaration.getStart(),
                    length: importDeclaration.getText().length,
                    text: `_jsLib.import("${importInfo.pkgName}"` + 
                            `, "${importInfo.scriptPath}", null, null` +
                            `, "${importPath}");`,
                });
            } else {
                replaces.push({
                    start: importDeclaration.getStart(),
                    length: importDeclaration.getText().length,
                    text: `_jsLib.importDeclaration("${importInfo.pkgName}"` + 
                            `, "${importInfo.scriptPath}", [ ${importedDefines_Parsed.join(", ")} ]` +
                            `, "${importPath}");`,
                });
            }

            if (importPath[importPath.length - 1] === ".") {
                errors.push(`Error in ${scriptFSPath}:${importDeclaration.getStartLineNumber()}` +
                        `:${importDeclaration.getStart() - importDeclaration.getStartLinePos()}\r\n` +
                        `Import path '${importPath}' not supported.`);
            }
        }

        replaces.sort((a, b) => {
            return b.start - a.start;
        });
        for (let i = 0; i < replaces.length; i++) {
            data = data.substring(0, replaces[i].start) + replaces[i].text + 
                    data.substring(replaces[i].start + replaces[i].length);
        }

        return data;
    }

    #parseData_ReplaceImports_FindReferences(libName: string, libFSPath: string, 
            scriptFSPath: string, importDeclaration: ImportDeclaration, 
            sourceFile: SourceFile, importName: string, aliasName: string|undefined, 
            importReferenceFinds: ReferencedSymbol[], 
            replaces: Array<{start: number, length: number, text: string}>, 
            importedDefines: Array<ImportDefine>, errors: Array<string>): void {
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

                importedDefines.push({ 
                    name: importName, 
                    alias: symbolText,
                });

                replaces.push({
                    start: importReference.getNode().getStart(),
                    length: symbolText.length,
                    text: `(_jsLib.import("${importInfo.pkgName}"` +
                            `, "${importInfo.scriptPath}", "${importName}"` +
                            `, "${aliasName === undefined ? symbolText : aliasName}"` +
                            `, "${importPath}"))`,
                });

                if (importPath[importPath.length - 1] === ".") {
                    errors.push(`Error in ${scriptFSPath}:${importDeclaration.getStartLineNumber()}` +
                            `:${importDeclaration.getStart() - importDeclaration.getStartLinePos()}\r\n` +
                            `Import path '${importPath}' not supported.`);
                }
            }
        }
    }

    #resolveImportInfo(importNode: Node<ts.Node>, libName: string, libFSPath: string, 
            scriptFSPath: string, importPath: string, errors: Array<string>): 
            {pkgName: string, scriptPath: string,} {
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