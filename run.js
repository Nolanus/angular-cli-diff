// Versions to be ignored, e.g. due to serious bugs that prevent them from functioning
const ignoreVersions = ['1.0.0-beta.28.3'];

const chalk = require('chalk');
const async = require('async');

const ngCli = require('./util/ngcli');
const npm = require('./util/npm');
const gitUtil = require('./util/git');

console.log(chalk.bold.underline.magenta('angular-cli-diff'));
async.auto({
    gitBranches: (cb) => {
        console.log(chalk.dim('Checking local git branches...'));
        gitUtil.getLocalBranches(__dirname, (error, branches) => {
            if (error) {
                cb(error);
                return;
            }
            const versions = branches.map(branch => {
                const matches = branch.match(/ng\/([^\/]+)/);
                if (matches === null) {
                    return null;
                }
                return matches[1];
            }).reduce((arr, version) => {
                if (version !== null && arr.indexOf(version) < 0) {
                    arr.push(version);
                }
                return arr;
            }, []);

            cb(null, versions);
        });
    },
    gitRemoteUrl: ['cliOptions', ({cliOptions}, cb) => {
        gitUtil.getRemoteUrl(__dirname, (err, url) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, cliOptions.noSsh ? url : url.replace(/https:\/\/github.com\//, 'git@github.com:'));
        });
    }],
    npmVersions: (cb) => {
        console.log(chalk.dim('Checking existing @angular/cli versions...'));
        npm('view', '@angular/cli', {}, (err, details) => {
            if (err) {
                return cb(err);
            }
            // console.log(arguments);
            const detailKeys = Object.keys(details);
            // console.log(details[detailKeys[0]].versions);
            cb(null, details[detailKeys[0]].versions);
        });
    },
    cliOptions: (cb) => {
        const options = {
            localMode: false,
            noSsh: false
        };
        process.argv.slice(2).forEach((argument) => {
            switch (argument) {
                case '--local':
                    options.localMode = true;
                    break;
                case '--no-ssh':
                    options.noSsh = true;
                    break;
            }
        });
        cb(null, options);
    }
}, (err, results) => {
    if (err) {
        console.error(err);
        return;
    }
    const missingVersions = results.npmVersions.filter((filterTag) => {
        return results.gitBranches.indexOf(filterTag) === -1 && ignoreVersions.indexOf(filterTag) === -1;
    });
    console.log('The following versions are missing\n' + missingVersions.map(version => '- ' + version).join('\n'));
    async.eachLimit(missingVersions, 1, (version, cb) => {
        const options = Object.assign({}, results.cliOptions, {
            basePath: __dirname,
            angularCliVersion: version,
            gitRemoteUrl: results.gitRemoteUrl
        });
        ngCli.createApp(options, (err) => {
            if (err) {
                console.error(chalk.red('Error while generating app for version ' + version));
                console.error(err);
                console.info(chalk.yellow('Will continue anyway'));
            }
            cb(null);
        });
    }, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.info(chalk.green('All testApps successfully generated'));
        }
    });
});
