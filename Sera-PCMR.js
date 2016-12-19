var Discord      = require('discord.io');
var Logger       = require('./Logger/index.js');
var Welcomer     = require('./Welcomer/index.js');
var RoleAssigner = require('./RoleAssigner/index.js');
                   require('./UselessServer');

var backoff   = 0;
var serverID  = process.env.PCMR_SERVER_ID;
var channelID = process.env.PCMR_LOG_ID;

var bot = new Discord.Client({
    token:   process.env.SERA_TOKEN,
    autorun: true
});

var logger   = new Logger(bot, serverID, channelID);
var welcomer = new Welcomer(bot, serverID);
var RA       = new RoleAssigner(bot, serverID);

bot.on('ready', function() {
    backoff = 0;
});

bot.on('disconnect', function(msg, code) {
    backoff += 1500;
    console.log("%s (%d) \nReconnecting in: %dms", msg, code, backoff);
    setTimeout(bot.connect, backoff);
});
