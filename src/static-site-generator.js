const fs = require('fs');
const fse = require('fs-extra');
const pug = require('pug');
const markdown = require( "marked" );
const lexer = require( "marked" ).lexer;
const chalk = require('chalk');
const sass = require('node-sass');
const webpack = require('webpack');
const path = require('path');
const chokidar = require('chokidar');
const browserSync = require('browser-sync');
const ncp = require('ncp').ncp;
const slugify = require('slugify')


const cwd = process.cwd();
const srcDirectory = [cwd, 'src', 'markdown'].join('/');
const templatesDirectory = [cwd, 'src', 'pug', 'templates'].join('/');
const stylesPath = [cwd, 'src', 'scss', 'index.scss'].join('/');
const scriptsPath = [cwd, 'src', 'js', 'index.js'].join('/');
const buildDirectory = [cwd, 'build'].join('/');

function staticSiteGenerator(_options) {
    if(!_options) _options = {};

    crawlDirectory(srcDirectory);
    renderCss(stylesPath);
    compileJs(scriptsPath);
    copyAssets();

    if(_options.watch) {
        watch();

        browserSync({
            server: "build",
            files: ["build/**/*.html", "build/*.css", "build/*.js"]
        });
    }
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
        chalk.green('Render'),
        chalk.green.bold(_path),
    ].join(' '));
    const fileContent = fs.readFileSync(_path);
    const fileSettings = lexer(fileContent.toString());

    const settings = {
        content: markdown(fileContent.toString()),
    };

    let toc = [];
    fileSettings.forEach((item) => {
        if(item.type === 'heading' && item.depth === 2) {
            toc.push({
                title: item.text,
                slug: '#' + slugify(item.text.toLowerCase()),
            });
        }
    });

    settings.toc = toc;

    if(fileSettings.links._title) settings.pageTitle = fileSettings.links._title.title;
    if(fileSettings.links._description) settings.description = fileSettings.links._description.title;

    let renderedFileContent = pug.renderFile([templatesDirectory, 'default.pug'].join('/'), settings);

    const regex = /(href=".*?)\.(md)/gm;
    const subst = '$1.html';

    // The substituted value will be contained in the result variable
    renderedFileContent = renderedFileContent.replace(regex, subst);


    const outputPath = [buildDirectory, _path.replace(srcDirectory+'/', '').replace('.md', '.html')].join('/');

    fse.outputFile(outputPath, renderedFileContent, (err) => {
        if(err) console.error(err);
    });
}

function renderCss(_file) {
    console.log([
        chalk.magenta('Compile'),
        chalk.magenta.bold(_file),
    ].join(' '));
    sass.render({
        file: _file,
        outFile: [buildDirectory, 'index.css'].join('/'),
        // outputStyle: 'compressed',
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

function watch() {
    chokidar.watch(srcDirectory).on('all', (event, path) => {
        console.info([
            chalk.gray('Watch'),
            chalk.gray.bold(event),
            chalk.gray.bold(path),
        ].join(' '));

        switch(event) {
            case 'change':
                crawlDirectory(srcDirectory);
            default:
        }
    });

    chokidar.watch([cwd, 'src', 'scss'].join('/')).on('all', (event, path) => {
        console.info([
            chalk.gray('Watch'),
            chalk.gray.bold(event),
            chalk.gray.bold(path),
        ].join(' '));

        switch(event) {
            case 'change':
                renderCss(stylesPath);
            default:
        }
    });

    chokidar.watch([cwd, 'src', 'js'].join('/')).on('all', (event, path) => {
        console.info([
            chalk.gray('Watch'),
            chalk.gray.bold(event),
            chalk.gray.bold(path),
        ].join(' '));

        switch(event) {
            case 'change':
                compileJs(scriptsPath);
            default:
        }
    });

    chokidar.watch(templatesDirectory).on('all', (event, path) => {
        console.info([
            chalk.gray('Watch'),
            chalk.gray.bold(event),
            chalk.gray.bold(path),
        ].join(' '));

        switch(event) {
            case 'change':
                crawlDirectory(srcDirectory);
            default:
        }
    });
}

function copyAssets() {
    ncp(
        [cwd, 'src', 'assets'].join('/'),
        [buildDirectory, 'assets'].join('/'),
        function (err) {
            if (err) {
                return console.error(err);
            }
            console.log('done!');
        });
}

module.exports = staticSiteGenerator;