const npm = require('npm');

module.exports = function (command, argument, flags, cb) {
    if (!flags) {
        flags = {};
    }
    if (flags.parseable === undefined) {
        flags.parseable = true;
    }
    npm.load(flags, (err, npmInstance) => {
        npmInstance.commands[command]([argument], cb);
    });
};
