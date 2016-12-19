/*Add or remove users from permission safe roles.
Intended for mentioning, but people are probably
just going to use it for getting a colored name.*/
var info = console.log.bind(console, "[RoleAssigner]");

var allowed = {
    "Coders":  "229748381159915520",
    "Techies": "229748333114163200",
    "Players": "222989842739363840"
};

var reactions = {
    OK: "\u2611",
    NO: "\u274c",
    NA: "\u2753",
    ER: "\u2757"
};

var assign = "assign";
var remove = "remove";
var regex = /\s+/;

function RoleAssigner(client, serverID) {
    client.on('message', handleMessage.bind(null, client, serverID));
}

function handleMessage(client, serverID, username, userID, channelID, message, event) {
    if (!isExpectedServer(client, channelID, serverID)) return;
    if (!isDirected(client, message)) return;
    if ( (message.indexOf(assign) < 0) && (message.indexOf(remove) < 0) ) return;
    var split, roleID, roleName, IDs;

    split = message.split(regex);
    if (!allowed.hasOwnProperty( roleName = split[2] )) {
        return client.addReaction({
            channelID: channelID,
            messageID: event.d.id,
            reaction: reactions.NO
        });
    }

    roleID = allowed[roleName];
    IDs = {
        channelID: channelID,   userID:    userID,
        messageID: event.d.id,  roleID:    roleID,
        serverID:  serverID
    };

    if (split[1] === assign) return assignRole(client, IDs);
    if (split[1] === remove) return removeRole(client, IDs);
}

function assignRole(client, IDs) {
    if (hasRole(client, IDs)) return client.addReaction(react(IDs, reactions.NA));
    return client.addToRole(roleInfo(IDs), postFeedback.bind(null, client, IDs));
}

function removeRole(client, IDs) {
    if (!hasRole(client, IDs)) return client.addReaction(react(IDs, reactions.NA));
    return client.removeFromRole(roleInfo(IDs), postFeedback.bind(null, client, IDs));
}

function hasRole(client, IDs) {
    var member = client.servers[IDs.serverID].members[IDs.userID];
    return member && member.roles.indexOf(IDs.roleID) > -1;
}

function notAllowed(client, IDs, error) {
    info(JSON.stringify(error));
    return client.addReaction(react(IDs, reactions.ER));
}

function react(IDs, reaction) {
    return {
        channelID: IDs.channelID,
        messageID: IDs.messageID,
        reaction:  reaction
    };
}

function roleInfo(IDs) {
    return {
        serverID: IDs.serverID,
        userID:   IDs.userID,
        roleID:   IDs.roleID
    };
}

function postFeedback(client, IDs, err, res) {
    if (err) return notAllowed(client, IDs, err);
    return client.addReaction(react(IDs, reactions.OK));
}

function isDirected(client, message) {
    return message.startsWith(`<@${client.id}>`);
}

function isExpectedServer(client, channelID, serverID) {
    var channel = client.channels[channelID];
    return !!channel && channel.guild_id === serverID;
}

module.exports = RoleAssigner;