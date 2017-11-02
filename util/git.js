const exec = require('child_process').exec;

module.exports = {
    getRemoteUrl: (repoPath, cb) => {
        exec('git config remote.origin.url', {cwd: repoPath}, (err, stdout) => {
            cb(err, stdout.trim());
        });
    },
    getLocalBranches: (repoPath, cb) => {
        exec('git branch', {cwd: repoPath}, (error, stdout) => {
            cb(error, stdout.split('\n').map(line => line.trim()));
        });
    },
    cloneRepo: (repoUrl, targetFolder, branch, cb) => {
        exec('git clone' + (branch ? ' -b ' + branch : '') + ' ' + repoUrl + (targetFolder ? ' ' + targetFolder : ''), (err, stdout) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, stdout);
        });
    },
    createBranch: (repoPath, branchName, startPoint, cb) => {
        exec('git branch --track -f ' + branchName + (startPoint ? ' ' + startPoint : '') + ' && git checkout ' + branchName, {cwd: repoPath}, (err, stdout) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, stdout);
        });
    },
    addAllAndCommit: (repoPath, commitMessage, cb) => {
        exec('git add . && git commit -m "' + commitMessage + '"', {cwd: repoPath}, (err, stdout) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, stdout);
        });
    },
    pushToOrigin: (repoPath, cb) => {
        exec('git push origin', (err, stdout) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, stdout);
        });
    }
};
