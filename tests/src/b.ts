import ts0 from "ts0";
/* @ab-ignore */
import spocky from "spocky";

export default class Home extends spocky.Layout {
    static get Content(): Array {
        return [["h1",{},"Home"]];
    }

    constructor(defaultFieldValues: ts0.TRawObject = {}) {
        super(Home.Content, defaultFieldValues);
    }
}
