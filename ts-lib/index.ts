import WebBuilder from "./WebBuilder.ts";

class jsLibs_Class {
    get WebBuilder(): typeof WebBuilder {
        return WebBuilder;
    }


    async buildLib_Async(name: string, fsPath: string, 
            buildFSPath: string, parseTS: boolean = false): Promise<void> {
        let webBuilder = new WebBuilder(name, fsPath, buildFSPath);
        await webBuilder.buildLib_Async(parseTS);
    }

    async buildPkg_Async(name: string, fsPath: string, 
            buildFSPath: string, parseTS: boolean = false): Promise<void> {
        let webBuilder = new WebBuilder(name, fsPath, buildFSPath);
        await webBuilder.buildPkg_Async(parseTS);
    }

    async buildScript_Async(name: string, fsPath: string, 
            buildFSPath: string, fileFSPath: string, parseTS: boolean = false):
            Promise<void>{
        let webBuilder = new WebBuilder(name, fsPath, buildFSPath);
        await webBuilder.buildScript_Async(fileFSPath, parseTS);
    }
}
const jsLibs = new jsLibs_Class();
export default jsLibs;
export { jsLibs_Class };