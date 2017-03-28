"use strict";
/*Add or remove users from permission safe roles.
Intended for mentioning, but people are probably
just going to use it for getting a colored name.*/
var info = console.log.bind(console, "[RoleAssigner]");

var utils     = require('../utils.js');
var allowed   = require('../roles.js');
var reactions = require('../reactions.js');

var assign = "assign";
var remove = "remove";
var regex  = /\s+/;

function RoleAssigner(client, serverID) {
    return client.on('message', handleMessage.bind(null, client, serverID));
}

function handleMessage(client, serverID, username, userID, channelID, message, event) {
    if (!utils.isExpectedServer(client, channelID, serverID)) return;
    if (!utils.isDirected(client, message)) return;
    if ( (message.indexOf(assign) < 0) && (message.indexOf(remove) < 0) ) return;
    var split, roleID, roleName, IDs, allowed;

    allowed = this.allowed.user_allowed;
    split = message.split(regex);

    if (utils.isMod(client, serverId, userID)) {
        allowed.concat(this.allowed.mod_assignable).split(",");
    }

    if (!allowed.hasOwnProperty( roleName = split[2] )) {
        return client.addReaction({
            channelID: channelID,
            messageID: event.d.id,
            reaction:  reactions.NO
        });
    }

    roleID = allowed[roleName];
    IDs = {
        channelID: channelID,   userID: userID,
        messageID: event.d.id,  roleID: roleID,
        serverID:  serverID
    };

    if (split[1] === assign) return assignRole(client, IDs);
    if (split[1] === remove) return removeRole(client, IDs);
}

function assignRole(client, IDs) {
    if (hasRole(client, IDs)) return client.addReaction(utils.react(IDs, reactions.NA));
    return client.addToRole(roleInfo(IDs), postFeedback.bind(null, client, IDs));
}

function removeRole(client, IDs) {
    if (!hasRole(client, IDs)) return client.addReaction(utils.react(IDs, reactions.NA));
    return client.removeFromRole(roleInfo(IDs), postFeedback.bind(null, client, IDs));
}

function hasRole(client, IDs) {
    var member = client.servers[IDs.serverID].members[IDs.userID];
    return member && member.roles.indexOf(IDs.roleID) > -1;
}

function notAllowed(client, IDs, error) {
    info(error.message);
    info(error.stack);
    return client.addReaction(utils.react(IDs, reactions.ER));
}

function postFeedback(client, IDs, err) {
    if (err) return notAllowed(client, IDs, err);
    return client.addReaction(utils.react(IDs, reactions.OK));
}

function roleInfo(IDs) {
    return {
        serverID: IDs.serverID,
        userID:   IDs.userID,
        roleID:   IDs.roleID
    };
}

module.exports = RoleAssigner;