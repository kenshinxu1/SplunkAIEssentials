const path = require('path');
const { merge: webpackMerge } = require('webpack-merge');
const baseComponentConfig = require('@splunk/webpack-configs/component.config').default;

module.exports = webpackMerge(baseComponentConfig, {
    entry: {
        Casedemo2: path.join(__dirname, 'src/Casedemo2.tsx'),
    },
    output: {
        path: path.join(__dirname),
    },
});
