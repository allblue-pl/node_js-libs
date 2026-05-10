import WebBuilder from "./WebBuilder.js";
class jsLibs_Class {
    get WebBuilder() {
        return WebBuilder;
    }
    async buildLib_Async(name, fsPath, buildFSPath, parseTS = false) {
        let webBuilder = new WebBuilder(name, fsPath, buildFSPath);
        await webBuilder.buildLib_Async(parseTS);
    }
    async buildPkg_Async(name, fsPath, buildFSPath, parseTS = false) {
        let webBuilder = new WebBuilder(name, fsPath, buildFSPath);
        await webBuilder.buildPkg_Async(parseTS);
    }
    async buildScript_Async(name, fsPath, buildFSPath, fileFSPath, parseTS = false) {
        let webBuilder = new WebBuilder(name, fsPath, buildFSPath);
        await webBuilder.buildScript_Async(fileFSPath, parseTS);
    }
}
const jsLibs = new jsLibs_Class();
export default jsLibs;
export { jsLibs_Class };
