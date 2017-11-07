// Versions to be ignored, e.g. due to serious bugs that prevent them from functioning
const ignoreVersions = ['1.0.0-beta.28.3'];

const path = require('path');

const async = require('async');

const ngCli = require('./util/ngcli');
const npm = require('./util/npm');
const gitUtil = require('./util/git');

async.auto({
    gitBranches: (cb) => {
        console.log('Checking local git branches...');
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
    gitRemoteUrl: (cb) => {
        gitUtil.getRemoteUrl(__dirname, cb);
    },
    npmVersions: (cb) => {
        console.log('Checking existing @angular/cli versions...');
        npm('view', '@angular/cli', {}, (err, details) => {
            if (err) {
                return cb(err);
            }
            // console.log(arguments);
            const detailKeys = Object.keys(details);
            // console.log(details[detailKeys[0]].versions);
            cb(null, details[detailKeys[0]].versions);
        });
    }
}, (err, results) => {
    if (err) {
        console.error(err);
        return;
    }
    const missingVersions = results.npmVersions.filter((filterTag) => {
        return results.gitBranches.indexOf(filterTag) === -1 && ignoreVersions.indexOf(filterTag) === -1;
    });
    console.log('The following versions are missing ' + missingVersions);

    async.eachLimit(missingVersions, 1, (version, cb) => {
        ngCli.createApp(__dirname, version, results.gitRemoteUrl, (err) => {
            if (err) {
                console.error('Error while generating app for version ' + version);
                console.error(err);
                console.info('Will continue anyway');
            }
            cb(null);
        });
    }, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.info('All testApps successfully generated');
        }
    });
});
