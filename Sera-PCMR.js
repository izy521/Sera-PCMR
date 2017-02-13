var Discord      = require('discord.io');
var Logger       = require('./modules/Logger/index.js');
var Banner       = require('./modules/Banner/index.js');
var Welcomer     = require('./modules/Welcomer/index.js');
var RoleAssigner = require('./modules/RoleAssigner/index.js');
                   require('./modules/UselessServer');

var backoff   = 0;
var serverID  = process.env.PCMR_SERVER_ID;
var channelID = process.env.PCMR_LOG_ID;

var bot = new Discord.Client({
    token:   process.env.SERA_TOKEN,
    autorun: true
});

var banner   = new Banner(bot, serverID);
var welcomer = new Welcomer(bot, serverID);
var RA       = new RoleAssigner(bot, serverID);
var logger   = new Logger(bot, serverID, channelID);

bot.on('ready', function() {
    bot.getAllUsers(console.log);
    backoff = 0;
});

bot.on('allUsers', function() {
    console.log("Sera is up!");
});

bot.on('disconnect', function(msg, code) {
    backoff += 1500;
    console.log("%s (%d) \nReconnecting in: %dms", msg, code, backoff);
    setTimeout(bot.connect, backoff);
});
