jsLibs.exportModule('js-script-0', 'test-script.js', (require, module, exports) => { 'use strict';

const
    js0 = require('js0'),

    abFields = require('ab-fields'),
    abNodes = require('ab-nodes')
;

/* export default const; */ const App = require('./App');
/* export default const; */ const Ext = require('./Ext');
/* export default const; */ const Holder = require('./Holder');
/* export default const; */ const Layout = require('./Layout');
/* export default const; */ const Module = require('./Module');
/* export default const; */ const Viewable = require('./Viewable');

const exts = [];

/* export default function; */ function ext(spockyExt) {
    js0.args(arguments, Ext);

    Layout.Extensions.push((layoutNode) => {
        spockyExt.onParseLayoutNode(layoutNode);
    });
}


/* export default let; */ let Debug = false;
/* export default function; */ function setDebug(debug) {
    exports.Debug = debug;
    abFields.setDebug(debug);
    abNodes.setDebug(debug);
};module.exports.App = App;
module.exports.Ext = Ext;
module.exports.Holder = Holder;
module.exports.Layout = Layout;
module.exports.Module = Module;
module.exports.Viewable = Viewable;
module.exports.ext = ext;
module.exports.Debug = Debug;
module.exports.setDebug = setDebug;
 });