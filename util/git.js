const exec = require('child_process').exec;

function _exec(cwd, command, cb) {
    exec(command, {cwd}, (err, stdout) => {
        if (err) {
            cb(err);
            return;
        }
        cb(null, stdout);
    });
}

/**
 * Provide some helpful methods to interact with a git repo in a directory.
 *
 * Note: None of these methods takes care of properly escaping the inputs!
 * So make sure the strings are from trustworthy sources or properly escaped
 * for usage in bash.
 *
 */
module.exports = {
    getRemoteUrl: (repoPath, cb) => {
        _exec(repoPath, 'git config remote.origin.url', (err, data) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, data.trim());
        });
    },
    getLocalBranches: (repoPath, cb) => {
        _exec(repoPath, 'git branch', (err, data) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, data.split('\n').map(line => line.replace(/^\* /, '').trim()));
        });
    },
    cloneRepo: (repoUrl, targetFolder, branch, cb) => {
        _exec(undefined, 'git clone' + (branch ? ' -b ' + branch : '') + ' ' + repoUrl + (targetFolder ? ' ' + targetFolder : ''), cb);
    },
    createBranch: (repoPath, branchName, startPoint, cb) => {
        _exec(repoPath, 'git branch --track -f ' + branchName + (startPoint ? ' ' + startPoint : '') + ' && git checkout ' + branchName, cb);
    },
    addAllAndCommit: (repoPath, commitMessage, cb) => {
        _exec(repoPath, 'git add . && git commit -m "' + commitMessage + '"', cb);
    },
    pushToOrigin: (repoPath, cb) => {
        _exec(repoPath, 'git push origin', cb);
    },
    pushAllTo: (repoPath, pushTarget, cb) => {
        _exec(repoPath, 'git push --all ' + pushTarget, cb);
    },
    setUserData: (repoPath, username, userMail, cb) => {
        _exec(repoPath, 'git config user.name "' + username + ' " && git config user.email "' + userMail + '"', cb);
    }
};
