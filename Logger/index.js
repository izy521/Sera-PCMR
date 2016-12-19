/*Inform mods on various things that
happen in the server*/
var info = console.log.bind(console, "[Logger]");

var colors = {
    user_joined:     0x52B3D9,
    user_removed:    0xF9BF3B,
    user_banned:     0xF64747,
    user_unbanned:   0xE08283,
    role_created:    0xE67E22,
    role_deleted:    0xD35400,
    channel_created: 0xBDC3C7,
    channel_updated: 0x95A5A6,
    channel_deleted: 0x6C7A89
};

function Logger(client, serverID, channelID) {
    client.on('any', handleEvents.bind(null, client, serverID, channelID));
}

module.exports = Logger;

function handleEvents(client, serverID, channelID, event) {
    if (!event.t) return;
    if (event.d.guild_id !== serverID) return;
    var data = event.d, changes, embed, role, payload;
    
    switch (event.t) {
        case "GUILD_MEMBER_ADD":
            embed = createEmbed("User joined", colors.user_joined, user(data.user).concat(
                { name: "Account Created", value: new Date( creationDate(data.user.id) ).toUTCString() }
            ));
            break;
        /*case "GUILD_MEMBER_UPDATE":
            break;*/
        case "GUILD_MEMBER_REMOVE":
            embed = createEmbed("User removed", colors.user_removed, user(data.user));
            break;
        case "GUILD_BAN_ADD":
            embed = createEmbed("User banned", colors.user_banned, user(data.user));
            break;
        case "GUILD_BAN_REMOVE":
            embed = createEmbed("User unbanned", colors.user_unbanned, user(data.user));
            break;
        case "GUILD_ROLE_CREATE":
            embed = createEmbed("Role created", colors.role_created, quickField("Role ID", data.role.id));
            break;
        /*case "GUILD_ROLE_UPDATE":
            
            break;*/
        case "GUILD_ROLE_DELETE":
            payload = [], role = client.servers[data.guild_id].roles[data.role_id];
            if (role) payload.push({ name: "Role Name", value: role.name, inline: true });
            payload.push({ name: "Role ID", value: data.role_id, inline: true });
            embed = createEmbed("Role deleted", colors.role_deleted, payload);
            break;
        case "CHANNEL_CREATE":
            embed = createEmbed("Channel created", colors.channel_created, quickField("Channel ID", data.id));
            break;
        case "CHANNEL_UPDATE":
            changes = oChanges( client.channels[data.id], data, ["last_message_id", "members", "permission_overwrites", "permissions"] );
            embed = createEmbed("Channel updated", colors.channel_updated, [
                { name: "Channel Name", value: data.name, inline: true},
                { name: "Channel ID",   value: data.id,   inline: true}
            ].concat( changes ? embedifyChanges(changes) : [] ));
            break;
        case "CHANNEL_DELETE":
            embed = createEmbed("Channel deleted", colors.channel_deleted, quickField("Channel ID", data.id));
            break;
    }
    return embed ? client.sendMessage({
        to: channelID,
        embed: embed
    }, function(err) {
        return err ? info(JSON.stringify(err)) : null;
    }) : false;
}

function createEmbed(title, color, fields) {
    return {
        title: title,
        color: color,
        fields: fields,
        footer: eyecatch()
    };
}

function user(userData) {
    return [
        { name: "Discord Tag", value: `${userData.username}#${userData.discriminator}`, inline: true },
        { name: "User ID",     value: userData.id,                                      inline: true }
    ];
}

function quickField(name, value) {
    return [{ name: name, value: value, inline: true}];
}

function embedifyChanges(changes) {
    return changes.map(function(change) {
        return { name: change.k, value: `\`${change.c[0]}\` -> \`${change.c[1]}\`` };
    });
}

function eyecatch() {
    var date = new Date();
    return { 
        text: `${date.toUTCString()} - ${+date}`,
        icon_url: 'https://cdn.discordapp.com/avatars/76137916358729728/7ffaba2454e279d32956aa079847dc27.jpg'
    };
}

function oChanges(o, o2, omit) {
    if (!omit) omit = [];
    var _changes = [];
    Object.keys(o).forEach(function(key) {
        if (omit.indexOf(key) > -1) return;
        if (o[key] === o2[key]) return;
        _changes.push( {k: key, c: [ o[key], o2[key] ]} );
    });

    return _changes[0] ? _changes : false;
}

function creationDate(id) {
    return (+id / 4194304) + 1420070400000;
}
