import type { Parser } from "./ts-types.ts";
export default class WebBuilder {
    #private;
    constructor(name: string, path: string, buildPath: string);
    addParser(parser: Parser): void;
    buildLib_Async(parseTS: boolean): Promise<Array<string>>;
    buildPkg_Async(parseTS: boolean): Promise<Array<string>>;
    buildScript_Async(filePath: string, parseTS: boolean): Promise<string>;
}
//# sourceMappingURL=WebBuilder.d.ts.map