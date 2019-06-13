const fs = require('fs');
const fse = require('fs-extra');
const pug = require('pug');
const markdown = require( "marked" );
const chalk = require('chalk');
const sass = require('node-sass');
const webpack = require('webpack');
const path = require('path');

const cwd = process.cwd();
const srcDirectory = [cwd, 'src', 'markdown'].join('/');
const templatesDirectory = [cwd, 'src', 'pug', 'templates'].join('/');
const stylesPath = [cwd, 'src', 'scss', 'index.scss'].join('/');
const scriptsPath = [cwd, 'src', 'js', 'index.js'].join('/');
const buildDirectory = [cwd, 'build'].join('/');

function staticSiteGenerator() {
    crawlDirectory(srcDirectory);
    renderCss(stylesPath);
    compileJs(scriptsPath);
};

function crawlDirectory(_directory) {
    console.log([
        chalk.yellow('Crawl   '),
        chalk.yellow.bold(_directory)
    ].join(''));
    fs.readdir(_directory, {withFileTypes: true}, (err, files) => {
        if(err) console.error(err)
        if(!err) {
            files.forEach((file) => {
                if(file.isDirectory()) {
                    crawlDirectory([_directory, file.name].join('/'))
                } else {
                    if(file.isFile()) {
                        renderFile([_directory, file.name].join('/'))
                    }
                }
            });
        }
    });
}

function renderFile(_path) {
    console.log([
        chalk.green('Render  '),
        chalk.green.bold(_path),
    ].join(''));
    const fileContent = fs.readFileSync(_path);
    const renderedFileContent = pug.renderFile([templatesDirectory, 'default.pug'].join('/'), {
        content: markdown(fileContent.toString()),
        pretty: true
    });

    const outputPath = [buildDirectory, _path.replace(srcDirectory+'/', '').replace('.md', '.html')].join('/');

    fse.outputFile(outputPath, renderedFileContent, (err) => {
        if(err) console.error(err);
    });
}

function renderCss(_file) {
    console.log([
        chalk.magenta('Compile '),
        chalk.magenta.bold(_file),
    ].join(''));
    sass.render({
        file: _file,
        outFile: [buildDirectory, 'index.css'].join('/'),
        outputStyle: 'compressed',
        sourceMap: true
    }, (err, result) => {
        if(err) console.error(err);
        if(!err) {
            fse.outputFile([buildDirectory, 'index.css'].join('/'), result.css, function(err){
                if(err) console.error(err);
            });

            fse.outputFile([buildDirectory, 'index.css.map'].join('/'), result.map, function(err){
                if(err) console.error(err);
            });
        }
    });
}

function compileJs(_file) {
    console.log([
        chalk.magenta('Compile '),
        chalk.magenta.bold(_file),
    ].join(''));

    webpack({
        mode: 'development',
        devtool: 'inline-source-map',
        entry: _file,
        output: {
            filename: 'index.js',
            path: buildDirectory
        }
    }, (err, result) => {
        if(err) console.error('Webpack error', err)
    });
}

module.exports = staticSiteGenerator;