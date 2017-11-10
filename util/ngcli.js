const path = require('path');
const exec = require('child_process').exec;

const move = require('glob-move');
const rimraf = require('rimraf');
const chalk = require('chalk');
const async = require('async');

const npm = require('./npm');
const gitUtil = require('./git');

const service = {};
service.generateAndCommit = (basePath, appPath, generateArguments, commitMessage, cb) => {
    exec('./../node_modules/.bin/ng ' + generateArguments, {cwd: appPath}, (error) => {
        if (error) {
            cb(error);
            return;
        }
        gitUtil.addAllAndCommit(appPath, commitMessage, cb);
    });
};
service.createApp = ({basePath, angularCliVersion, gitRemoteUrl, localMode, fullOutput}, cb) => {
    const appPath = path.resolve(basePath, 'app');
    console.log(chalk.bold.magenta('Processing @angular/cli@' + angularCliVersion));

    console.log(chalk.dim('Removing app and testApp folder'));
    async.each(['app', 'testApp'], rimraf, (rmErr) => {
        if (rmErr) {
            console.warn(rmErr);
        }
        console.log(chalk.dim('Cloning ng/base branch into app folder'));
        gitUtil.cloneRepo(gitRemoteUrl, 'app', 'ng/base', (cloneErr) => {
            if (cloneErr) {
                cb(cloneErr);
                return;
            }
            console.log(chalk.dim('Will now empty the app directory'));
            gitUtil.resetWithoutHeadMovement(appPath, 'ng-start', 'origin/ng/base', (resetErr, resetResult) => {
                if (resetErr) {
                    cb(resetErr);
                    return;
                }
                console.log('Working copy successfully reset: ' + resetResult);
                console.log(chalk.dim('Will install @angular/cli@' + angularCliVersion + ' now'));
                npm('install', '@angular/cli@' + angularCliVersion, {cwd: basePath}, (npmInstallErr, output) => {
                    if (npmInstallErr) {
                        cb(npmInstallErr);
                        return;
                    }
                    console.log(chalk.green('Installed @angular/cli@' + angularCliVersion + ':'));
                    if (fullOutput) {
                        console.log(output);
                    }
                    console.log(chalk.dim('Creating new app branch'));
                    gitUtil.checkout(appPath, 'ng/' + angularCliVersion + '/app', true, (checkoutErr, checkoutOutput) => {
                        if (checkoutErr) {
                            cb(checkoutErr);
                            return;
                        }
                        if (fullOutput) {
                            console.log(checkoutOutput);
                        }
                        console.log(chalk.dim('Will generate a new app now'));
                        exec('./node_modules/.bin/ng new testApp --skip-install --skip-npm --skip-git --skip-commit --verbose', {cwd: basePath}, (ngNewErr, stdout) => {
                            if (ngNewErr) {
                                cb(ngNewErr);
                                return;
                            }
                            console.log(chalk.bgGreen('App successfully generated with @angular/cli@' + angularCliVersion));
                            console.log(stdout);
                            console.log(chalk.dim('Moving testApp into app folder'));
                            move('testApp/*', 'app/', {dot: true}).then(() => {
                                console.log(chalk.dim('Configuring git repo and committing all changes'));
                                gitUtil.setUserData(appPath, 'Bot', '3458616+Nolanus@users.noreply.github.com', (setUserErr) => {
                                    if (setUserErr) {
                                        cb(setUserErr);
                                        return;
                                    }
                                    gitUtil.addAllAndCommit(appPath, 'Generate app using @angular/cli v' + angularCliVersion, (commitAllErr, commitOutput) => {
                                        if (commitAllErr) {
                                            cb(commitAllErr);
                                            return;
                                        }
                                        console.log(chalk.green('Successfully committed basic @angular/cli app'));
                                        console.log(commitOutput);

                                        gitUtil.checkout(appPath, 'ng/base', false, (checkout2Err, checkout2Output) => {
                                            if (checkout2Err) {
                                                cb(checkout2Err);
                                                return;
                                            }
                                            console.log(chalk.green('Successfully checked out the branch:'));
                                            console.log(checkout2Output);

                                            console.log(chalk.dim('Merging ng/' + angularCliVersion + '/app into the current branch'));
                                            gitUtil.merge(appPath, 'ng/' + angularCliVersion + '/app', (mergeErr, mergeOutput) => {
                                                if (mergeErr) {
                                                    cb(mergeErr);
                                                    return;
                                                }

                                                console.log(chalk.green('Successfully merged branches:'));
                                                console.log(mergeOutput);

                                                console.log(chalk.dim('Changing back onto ng/' + angularCliVersion + '/app branch'));
                                                gitUtil.checkout(appPath, 'ng/' + angularCliVersion + '/app', false, (checkout3Err, checkout3Output) => {
                                                    if (checkout3Err) {
                                                        cb(checkout3Err);
                                                        return;
                                                    }
                                                    console.log(chalk.green('Successfully checked out the branch'));
                                                    if (fullOutput) {
                                                        console.log(checkout3Output);
                                                    }

                                                    // Now generate some things and commit them
                                                    async.eachLimit([
                                                        ['service', 'generate service rebel', 'Service generation'],
                                                        ['component', 'generate component contact', 'Component generation'],
                                                        ['directive', 'generate directive foo', 'Directive generation'],
                                                        ['pipe', 'generate pipe drain', 'Pipe generation'],
                                                        ['enum', 'generate enum foo', 'Enum generation'],
                                                        ['module', 'generate module example', 'Module generation'],
                                                    ], 1, (data, eachCb) => {
                                                        console.log(chalk.dim('About to generate a ' + data[0]));
                                                        gitUtil.createBranch(appPath, 'ng/' + angularCliVersion + '/' + data[0], 'ng/' + angularCliVersion + '/app', (branchErr) => {
                                                            if (branchErr) {
                                                                eachCb(branchErr);
                                                                return;
                                                            }
                                                            service.generateAndCommit(basePath, appPath, data[1], data[2], (commitErr) => {
                                                                if (commitErr) {
                                                                    console.error(chalk.red('Error while generating and committing, will continue anyway'));
                                                                    console.error(commitErr);
                                                                }
                                                                if (localMode) {
                                                                    console.log(chalk.yellow('In local mode, will skip pushing to origin'));
                                                                    eachCb(null);
                                                                } else {
                                                                    gitUtil.pushToOrigin(appPath, (pushErr) => {
                                                                        if (pushErr) {
                                                                            console.error(chalk.red('Error while pushing the generated component to origin, will continue anyway'));
                                                                            console.error(pushErr);
                                                                        }
                                                                        console.log(chalk.green('Successfully generated ' + data[0] + ' branch and committed the changes'));
                                                                        eachCb(null);
                                                                    });
                                                                }
                                                            });
                                                        });
                                                    }, (err) => {
                                                        if (err) {
                                                            console.error(chalk.red('One generation task seriously failed, will continue with next angular/cli version'));
                                                            console.error(err);
                                                        }
                                                        async.parallel({
                                                            npmUninstall: (parallelCb) => {
                                                                // Uninstall this angular/cli version
                                                                console.log(chalk.dim('Uninstalling the current @angular/cli version'));
                                                                npm('uninstall', '@angular/cli', {}, parallelCb);
                                                            },
                                                            gitPush: (parallelCb) => {
                                                                if (localMode) {
                                                                    console.log(chalk.yellow('In local mode, will skip pushing to origin'));
                                                                    parallelCb(null);
                                                                } else {
                                                                    console.log(chalk.dim('Pushing changes to origin'));
                                                                    gitUtil.pushAllTo(appPath, 'origin', (pushErr, pushOutput) => {
                                                                        if (pushErr) {
                                                                            console.error(chalk.red('Error while pushing changes, will continue anyway'));
                                                                            console.error(pushErr);
                                                                        } else {
                                                                            console.log(chalk.green('New Branches successfully pushed:'));
                                                                            console.log(pushOutput);
                                                                        }
                                                                        parallelCb(null);
                                                                    });
                                                                }
                                                            }
                                                        }, cb);
                                                    });
                                                });
                                            });
                                        });

                                    });
                                });
                            }).catch(cb);
                        });
                    });
                });
            });
        });
    });
};
module.exports = service;
