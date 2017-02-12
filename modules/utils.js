"use strict";
var mods = require('./roles.js').elevated;

module.exports = {
    react: react,
    isMod: isMod,
    isDirected: isDirected,
    isExpectedServer: isExpectedServer
};

function isMod(client, serverID, userID) {
    var server, member;
    server = client.servers[serverID];
    if (!server) return;
    member = server.members[userID];
    if (!member) return;
    return member.roles.some( roleID => mods.hasOwnProperty(roleID) );
}

function isDirected(client, message) {
    return message.startsWith(`<@${client.id}>`);
}

function isExpectedServer(client, channelID, serverID) {
    var channel = client.channels[channelID];
    return !!channel && channel.guild_id === serverID;
}

function react(IDs, reaction) {
    return {
        channelID: IDs.channelID,
        messageID: IDs.messageID,
        reaction:  reaction
    };
}