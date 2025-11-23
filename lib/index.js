'use strict';

const fs = require('fs');
const path = require('path');

const WebBuilder = require('./WebBuilder');


class jsLibs_Class {
    get WebBuilder() {
        return WebBuilder;
    }


    build(jsLibName, jsLibFSPath, buildFSPath, callback) { let self = this;
        let webBuilder = new WebBuilder(jsLibName, jsLibFSPath, buildFSPath);
        webBuilder.build(callback);
    }

    buildScript(jsLibName, jsLibFSPath, buildFSPath, fileFSPath, callback) {
        let webBuilder = new WebBuilder(jsLibName, jsLibFSPath, buildFSPath);
        webBuilder.buildScript(fileFSPath, callback);
    }
}
module.exports = new jsLibs_Class();