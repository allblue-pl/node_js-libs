'use strict';

const
    js0 = require('js0'),

    abFields = require('ab-fields'),
    abNodes = require('ab-nodes')
;

export const App = require('./App');
export const Ext = require('./Ext');
export const Holder = require('./Holder');
export const Layout = require('./Layout');
export const Module = require('./Module');
export const Viewable = require('./Viewable');

const exts = [];

export function ext(spockyExt) {
    js0.args(arguments, Ext);

    Layout.Extensions.push((layoutNode) => {
        spockyExt.onParseLayoutNode(layoutNode);
    });
}


export let Debug = false;
export function setDebug(debug) {
    exports.Debug = debug;
    abFields.setDebug(debug);
    abNodes.setDebug(debug);
};