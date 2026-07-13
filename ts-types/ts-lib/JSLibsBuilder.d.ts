import type { BuildResult } from "./ts-types.ts";
export default class JSLibsBuilder {
    #private;
    constructor();
    buildScript_Async(projectFSPath: string, libName: string, libFSPath: string, scriptFSPath: string, buildFSPath: string, tsconfigFSPath: string | null, sourceMap: boolean): Promise<BuildResult>;
    removeScript(libFSPath: string, scriptFSPath: string, buildFSPath: string): void;
    validateTSConfig_Async(projectFSPath: string, tsconfigFSPath: string): Promise<Array<string>>;
}
