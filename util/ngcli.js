const path = require('path');
const exec = require('child_process').exec;

const rimraf = require('rimraf');
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
service.createApp = (basePath, angularCliVersion, gitRemoteUrl, cb) => {
    const appPath = path.resolve(basePath, 'app');

    console.log('Removing probably existing app and testApp folder');
    async.each(['app', 'testApp'], rimraf, (rmErr) => {
        if (rmErr) {
            console.warn(rmErr);
        }
        gitUtil.cloneRepo(gitRemoteUrl, 'app', 'ng/base', (cloneErr) => {
            if (cloneErr) {
                console.error(cloneErr);
                return;
            }
            console.log('Will install @angular/cli@' + angularCliVersion + ' now');
            npm('install', '@angular/cli@' + angularCliVersion, {cwd: basePath}, (npmInstallErr, output) => {
                if (npmInstallErr) {
                    cb(npmInstallErr);
                    return;
                }
                console.log('Installed @angular/cli@' + angularCliVersion + ':');
                console.log(output);
                console.log('Creating new branch in app history');
                exec('git checkout -b ng/' + angularCliVersion + '/app', {cwd: appPath}, (checkoutErr) => {
                    if (checkoutErr) {
                        cb(checkoutErr);
                        return;
                    }
                    console.log('Will generate a new app now');
                    exec('./node_modules/.bin/ng new testApp --skip-install --skip-npm --skip-commit --verbose', {cwd: basePath}, (ngNewErr, stdout) => {
                        if (ngNewErr) {
                            cb(ngNewErr);
                            return;
                        }
                        console.log('App successfully generated');
                        console.log(stdout);
                        console.log('Moving testApp into app folder');
                        exec('mv testApp/{,.[!.]}* app', {cwd: basePath}, (mvErr) => {
                            if (mvErr) {
                                cb(mvErr);
                                return;
                            }
                            gitUtil.addAllAndCommit(appPath, 'Generate app using @angular/cli v' + angularCliVersion, (commitAllErr) => {
                                if (commitAllErr) {
                                    cb(commitAllErr);
                                    return;
                                }
                                console.log('Successfully committed basic @angular/cli app');

                                // Now generate some things and commit them
                                async.eachLimit([
                                    ['service', 'generate service rebel', 'Service generation'],
                                    ['component', 'generate component contact', 'Component generation'],
                                    ['directive', 'generate directive foo', 'Directive generation'],
                                    ['pipe', 'generate pipe drain', 'Pipe generation'],
                                    ['enum', 'generate enum foo', 'Enum generation'],
                                    ['module', 'generate module example', 'Module generation'],
                                ], 1, (data, eachCb) => {
                                    console.log('About to generate a ' + data[0]);
                                    gitUtil.createBranch(appPath, 'ng/' + angularCliVersion + '/' + data[0], 'ng/' + angularCliVersion + '/app', (branchErr) => {
                                        if (branchErr) {
                                            eachCb(branchErr);
                                            return;
                                        }
                                        service.generateAndCommit(basePath, appPath, data[1], data[2], (commitErr) => {
                                            if (commitErr) {
                                                console.error('Error while generating and committing, will continue anyway');
                                                console.error(commitErr);
                                            }
                                            gitUtil.pushToOrigin(appPath, (pushErr) => {
                                                if (pushErr){
                                                    console.error('Error while pushing the generated component to origin, will continue anyway');
                                                    console.error(pushErr);
                                                }
                                                eachCb(null);
                                            });
                                        });
                                    });
                                }, (err) => {
                                    if (err) {
                                        console.error('One generation task seriously failed, will continue with next angular/cli version');
                                        console.error(err);
                                    }
                                    // Uninstall this angular/cli version
                                    console.log('Uninstalling the current @angular/cli version');
                                    npm('uninstall', '@angular/cli', {}, cb);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
module.exports = service;
