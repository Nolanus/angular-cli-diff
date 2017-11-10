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
    fixOriginFetch: (repoPath, cb) => {
        _exec(repoPath, 'git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"', cb);
    },
    fetchAll: (repoPath, cb) => {
        _exec(repoPath, 'git fetch --all', cb);
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
    getRemoteBranches: (repoPath, cb) => {
        _exec(repoPath, 'git branch -r', (err, data) => {
            if (err) {
                cb(err);
                return;
            }
            cb(null, data.split('\n').map(line => line.substr(line.indexOf('/') + 1).trim()));
        });
    },
    getLocalTags: (repoPath, cb) => {
        _exec(repoPath, 'git tag -l', (err, data) => {
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
    checkout: (repoPath, branchName, create, cb) => {
        _exec(repoPath, 'git checkout ' + (create ? '-b ' : '') + branchName, cb);
    },
    createTag: (repoPath, tagName, cb) => {
        _exec(repoPath, 'git tag "' + tagName + '"', cb);
    },
    addAllAndCommit: (repoPath, commitMessage, cb) => {
        _exec(repoPath, 'git add --all . && git commit -m "' + commitMessage + '"', cb);
    },
    merge: (repoPath, mergeBranch, cb) => {
        _exec(repoPath, 'git merge --commit --ff "' + mergeBranch + '"', cb);
    },
    pushToOrigin: (repoPath, cb) => {
        _exec(repoPath, 'git push origin', cb);
    },
    pushAllTo: (repoPath, pushTarget, cb) => {
        _exec(repoPath, 'git push --all ' + pushTarget, cb);
    },
    resetWithoutHeadMovement: (repoPath, base, head, cb) => {
        _exec(repoPath, 'git reset --hard ' + base + ' && git reset --soft ' + head, cb);
    },
    setUserData: (repoPath, username, userMail, cb) => {
        _exec(repoPath, 'git config user.name "' + username + ' " && git config user.email "' + userMail + '"', cb);
    }
};
