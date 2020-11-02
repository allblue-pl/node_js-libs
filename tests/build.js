'use strict';

const
    path = require('path'),

    jsLibs = require('../.')
;


jsLibs.build('test-pkg', path.join(__dirname, './test-pkg'), 
        path.join(__dirname, 'build'), (err) => {
    console.log('Built: ', err);
});