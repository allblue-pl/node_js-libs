
export type BuildCallback = (err: Error|null, buildFSPaths: Array<string>|null) => void;

export type BuildResult = {
    scriptFSPath: string,
    scriptErrors: Array<string>,
    validationErrors: Array<string>,
};

export type ImportDefine = {
    name: string,
    alias: string|null,
};

export type Parser = (data: string, filePath: string, 
        builtFilePath: string) => string;