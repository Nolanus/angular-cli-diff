// Versions to be ignored, e.g. due to serious bugs that prevent them from functioning
const ignoreVersions = ['1.0.0-beta.28.3', '1.3.0-rc.4', '1.4.0-rc.0', '1.5.0-beta.0', '1.5.0-beta.1', '1.5.0-beta.2'];

const chalk = require('chalk');
const async = require('async');

const ngCli = require('./util/ngcli');
const npm = require('./util/npm');
const gitUtil = require('./util/git');

console.log(chalk.bold.underline.magenta('angular-cli-diff'));
async.auto({
    gitBranches: ['cliOptions', ({cliOptions}, cb) => {
        async.series(
            [
                async.apply(gitUtil.fixOriginFetch, __dirname),
                async.apply(gitUtil.fetchAll, __dirname)
            ],
            (fetchErr) => {
                if (fetchErr) {
                    cb(fetchErr);
                    return;
                }
                console.log(chalk.dim('Checking ' + (cliOptions.localMode ? 'local' : 'remote') + ' git branches...'));
                const getter = cliOptions.localMode ? gitUtil.getLocalBranches : gitUtil.getRemoteBranches;
                getter(__dirname, (error, branches) => {
                    if (error) {
                        cb(error);
                        return;
                    }
                    if (cliOptions.fullOutput) {
                        console.log('Loaded the following branches: ' + branches);
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
            });
    }],
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
            noSsh: false,
            stopAfterVersionFail: false,
            fullOutput: false
        };
        process.argv.slice(2).forEach((argument) => {
            switch (argument) {
                case '--local':
                    options.localMode = true;
                    break;
                case '--no-ssh':
                    options.noSsh = true;
                    break;
                case '--stop-on-fail':
                    options.stopAfterVersionFail = true;
                    break;
                case '--verbose':
                    options.fullOutput = true;
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
                if (results.cliOptions.stopAfterVersionFail) {
                    cb(err);
                    return;
                } else {
                    console.info(chalk.yellow('Will continue anyway'));
                }
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
