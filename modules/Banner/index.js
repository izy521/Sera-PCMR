"use strict";
/*Overall ban-by-message module
with reasons included if applicable*/
var info = console.log.bind(console, "[RoleAssigner]");

var Firebase  = require('firebase-admin');
var Snoocore  = require('snoocore');
var utils     = require('../utils.js');
var reactions = require('../reactions.js');

var ban_reg = /<@[0-9]+>\s+(ban)\s+<@([0-9]+)>\s+(\d+.\d+|\d+)($|\s.*|\s\w.*)/;
var SeraFB, SeraRD, credentials, SeraFBDB, bansDB, bans, unban_interval, one_day = 864e5;

credentials = Firebase.credential.cert({
    clientEmail: process.env.FIREBASE_EMAIL,
    projectId:   process.env.FIREBASE_PROJECT_ID,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') //Stupid Google
});
SeraFB = Firebase.initializeApp({
    credential:  credentials,
    databaseURL: process.env.FIREBASE_URL
});
SeraRD = new Snoocore({
    userAgent: process.env.REDDIT_USERAGENT,
    oauth: {
        type: 'script',
        key: process.env.REDDIT_CLIENT_ID,
        secret: process.env.REDDIT_SECRET,
        username: process.env.REDDIT_USERNAME,
        password: process.env.REDDIT_PASSWORD,
        scope: ['submit']
    }
});
SeraRD.auth();

function Banner(client, serverID) {
    unban_interval = setInterval(unban.bind(null, client, serverID), 1e4);
    client.on('ready', handleReady);
    client.on('message', handleMessage.bind(null, client, serverID));
    return client.on('disconnect', n => bansDB.off('value'));
}

function handleReady() {
    SeraFBDB = SeraFB.database();
    bansDB = SeraFBDB.ref(process.env.FIREBASE_BANS_DIR);
    return bansDB.on('value', ss => bans = ss.val());
}

function handleMessage(client, serverID, username, userID, channelID, message, event) {
    if (!utils.isExpectedServer(client, channelID, serverID)) return;
    if (!utils.isDirected(client, message)) return;
    if (!utils.isMod(client, serverID, userID)) return;
    var banDetails = parseBanMessage(userID, message);

    if (!banDetails) {
        return client.addReaction({
            channelID: channelID,
            messageID: event.d.id,
            reaction:  reactions.NA
        });
    }

    return informUser(client, banDetails)
        .then(setBan.bind(null, client, serverID))
        .then(postToReddit.bind(null, client))
        .then(confirmBan.bind(null, client, channelID, event.d.id))
        .catch(alertMod.bind(null, client, channelID, event.d.id));
}

function parseBanMessage(userID, message) {
    var match, bannerID, bannedID, reason, duration;
    if (!(match = message.match(ban_reg))) return;

    bannerID    =  userID;
    bannedID    =  match[2];
    reason      =  match[4].trim() || null;
    duration    =  (one_day * +match[3]);

    return {
        bannerID:       bannerID,
        bannedID:       bannedID,
        reason:         reason,
        duration:       duration,
        unbanned_after: duration ? (Date.now() + duration) : null
    };
}

function informUser(client, details) {
    var message = [
        "You have just been banned from /r/pcmasterrace's Discord server.",
        `This is a ${details.unbanned_after ? "temporary" : "permanent"} ban.`
    ];
    if (details.unbanned_after) {
        message.push(`You will be unbanned after ${(new Date(details.unbanned_after)).toUTCString()}`);
    }
    if (details.reason) {
        message.push(`Message from the mod: ${details.reason}`);
    }
    message = message.join("\n");
    return new Promise(function(resolve) {
        return client.sendMessage({
            to: details.bannedID,
            message: message
        }, function(err) {
            if (err) info(err);
            resolve(details);
        });
    });
}

function setBan(client, serverID, details) {
    return new Promise(function(resolve, reject) {
        return client.ban({
            serverID: serverID,
            userID: details.bannedID,
            lastDays: 1
        }, function(err) {
            if (err) return reject(err);

            SeraFBDB.ref(`${process.env.FIREBASE_BANS_DIR}/${details.bannedID}`)
                .set(details, DBErr => DBErr ? reject(DBErr) : resolve(details));
        });
    });
}

function postToReddit(client, details) {
    var title, body, banner, banned;

    banner = client.users[details.bannerID];
    banned = client.users[details.bannedID];

    title = [
        `[Auto]`,
        `[User ${details.unbanned_after ? "Temp " : ""}Banned]`,
        `${banned ? banned.username : details.bannedID}`,
        `by`,
        `${banner ? banner.username : details.bannerID}`,
        `Click for more details`
    ].join(' ');

    body = [
        `A user has been **${details.unbanned_after ? "temporarily" : "permanently"}** banned.`,
        `The ban took place on **${(new Date()).toUTCString()}**.`,
        `The banned user is **${banned ? `${banned.username} (${details.bannedID})` : details.bannedID }**`,
        `The acting moderator is **${banner ? `${banner.username} (${details.bannerID})` : details.bannerID}**`
    ];

    if (details.reason) body.push(`The reason is:\n>     ${details.reason}`);
    if (details.unbanned_after) body.push(`This ban will expire after **${new Date(details.unbanned_after)}**`);
    body.push(process.env.REDDIT_FOOTER_MESSAGE);
    body = body.join('\n\n');

    return SeraRD('/api/submit').post({
        api_type: 'json',
        kind: 'self',
        sr: process.env.REDDIT_SUBREDDIT,
        title: title,
        text: body
    });
}

function confirmBan(client, channelID, messageID) {
    return client.addReaction({
        channelID: channelID,
        messageID: messageID,
        reaction: reactions.OK
    });
}

function alertMod(client, channelID, messageID, error) {
    info(error);
    return client.addReaction({
        channelID: channelID,
        messageID: messageID,
        reaction: reactions.ER
    });
}

function unban(client, serverID) {
    if (!bans) return;
    var now = Date.now();
    Object.keys(bans).forEach(function(userID) {
        if (typeof(bans[userID]) !== 'object') return;
        if (bans[userID].unbanned_after < now) return;
        client.unban({
            serverID: serverID,
            userID: userID
        }, function(err) {
            if (err) info(err);
            SeraFBDB.ref(`${process.env.FIREBASE_BANS_DIR}/${userID}`).set(null);
        });
    });
}

module.exports = Banner;