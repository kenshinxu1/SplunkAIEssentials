const path = require('path');
const { merge: webpackMerge } = require('webpack-merge');
const baseComponentConfig = require('@splunk/webpack-configs/component.config').default;

module.exports = webpackMerge(baseComponentConfig, {
    entry: {
        Casedemo3: path.join(__dirname, 'src/Casedemo3.tsx'),
    },
    output: {
        path: path.join(__dirname),
    },
});
