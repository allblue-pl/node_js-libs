import type { TS0RawValue } from "@allblue/ts0";

const types_TNull = Symbol("abDataDefTypes_TNull");

export default class abDataDefTypes_Class {
    TArray(itemType: ABDataDefValueType): ABDataDefArrayType {
        return new ABDataDefArrayType(itemType);
    }

    TArrayPreset(presets: Array<ABDataDefValueType>): ABDataDefArrayPresetType {
        return new ABDataDefArrayPresetType(presets);
    }

    TDefault(defaultValue: TS0RawValue): ABDataDefDefaultType {
        return new ABDataDefDefaultType(defaultValue);
    }

    TEnum(values: Array<boolean|number|string>): ABDataDefEnumType {
        return new ABDataDefEnumType(values);
    }
    
    get TNull(): typeof types_TNull {
        return types_TNull;
    }

    TObject(keyType: ABDataDefValueType, valueType: ABDataDefValueType): 
            ABDataDefObjectType {
        return new ABDataDefObjectType(keyType, valueType);
    }

    TObjectPreset(presets: ABDataDefPreset, extras: ABDataDefObjectType|null = null): 
            ABDataDefObjectPresetType {
        return new ABDataDefObjectPresetType(presets, extras);
    }

    TTableRow(tableName: string): ABDataDefTableRowType {
        return new ABDataDefTableRowType(tableName);
    }
}
const abDataDefTypes = new abDataDefTypes_Class();
export default abDataDefTypes;


export class ABDataDefArrayType {
    #itemType: ABDataDefValueType;

    get itemType(): ABDataDefValueType {
        return this.#itemType;
    }

    constructor(itemType: ABDataDefValueType) {
        this.#itemType = itemType;
    }
}

export class ABDataDefArrayPresetType {
    #presets: Array<ABDataDefValueType>;

    get presets(): Array<ABDataDefValueType> {
        return this.#presets;
    }

    constructor(presets: Array<ABDataDefValueType>) {
        this.#presets = presets;
    }
}

export class ABDataDefDefaultType {
    #defaultValue: TS0RawValue;

    get defaultValue(): TS0RawValue {
        return this.#defaultValue;
    }

    constructor(defaultValue: TS0RawValue) {
        this.#defaultValue = defaultValue;
    }
}

export class ABDataDefEnumType {
    #values: Array<boolean|number|string>;

    get values(): Array<boolean|number|string> {
        return this.#values;
    }

    constructor(values: Array<boolean|number|string>) {
        this.#values = values;
    }
}

export class ABDataDefObjectType {
    #keyType: ABDataDefValueType;
    #itemType: ABDataDefValueType;

    get itemType(): ABDataDefValueType {
        return this.#itemType;
    }

    get keyType(): ABDataDefValueType {
        return this.#keyType;
    }

    constructor(keyType: ABDataDefValueType, itemType: ABDataDefValueType) {
        this.#keyType = keyType;
        this.#itemType = itemType;
    }
}

export class ABDataDefObjectPresetType {
    #presets: ABDataDefPreset;
    #extras: ABDataDefObjectType|null;

    get extras(): ABDataDefObjectType|null {
        return this.#extras;
    }

    get presets(): ABDataDefPreset {
        return this.#presets;
    }

    constructor(presets: ABDataDefPreset, extras: ABDataDefObjectType|null = null) {
        this.#presets = presets;
        this.#extras = extras;
    }
}

export class ABDataDefTableRowType {
    #tableName: string;

    get tableName(): string {
        return this.#tableName;
    }

    constructor(tableName: string) {
        this.#tableName = tableName;
    }
}

export class ABDataDefTypeFnType {
    #typeFn: () => ABDataDefValueType;

    get typeFn(): () => ABDataDefValueType {
        return this.#typeFn;
    }

    constructor(typeFn: () => ABDataDefValueType) {
        this.#typeFn = typeFn
    }
}

export type ABDataDefValueType = null|
        "bool"|"float"|"string"|"long"|"int"|
        typeof types_TNull|
        ABDataDefArrayPresetType|ABDataDefArrayType|ABDataDefDefaultType|
        ABDataDefEnumType|ABDataDefObjectPresetType|ABDataDefObjectType|
        ABDataDefTableRowType|ABDataDefTypeFnType|
        Array<ABDataDefValueType>;
export type ABDataDefPreset = {[name:string]: ABDataDefValueType};