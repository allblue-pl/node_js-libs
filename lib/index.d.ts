import WebBuilder from "./WebBuilder.ts";
declare class jsLibs_Class {
    get WebBuilder(): typeof WebBuilder;
    buildLib_Async(name: string, fsPath: string, buildFSPath: string, parseTS?: boolean): Promise<void>;
    buildPkg_Async(name: string, fsPath: string, buildFSPath: string, parseTS?: boolean): Promise<void>;
    buildScript_Async(name: string, fsPath: string, buildFSPath: string, fileFSPath: string, parseTS?: boolean): Promise<void>;
}
declare const jsLibs: jsLibs_Class;
export default jsLibs;
export { jsLibs_Class };
//# sourceMappingURL=index.d.ts.map