const staticSiteGenerator = require('./src/static-site-generator');
const commandLineArgs = require('command-line-args');

const options = commandLineArgs([
    {
        name: 'mode',
        alias: 'm',
        group: [
            'development',
            'production'
        ],
        defaultValue: 'production'
    },
    {
        name: 'base-dir',
        alias: 'b',
        type: String,
        defaultValue: '/'
    }
]);


staticSiteGenerator(options);
