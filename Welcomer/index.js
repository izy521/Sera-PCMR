/*Tell users to read the rules, 
with a direct link to the channel,
when they join.*/
var info = console.log.bind(console, "[Welcomer]");

var message = [
    "Welcome to the server!",
    "We have rules that we'd like you to follow, so make sure to check out the <#155309620540342272> channel.",
    "We hope you enjoy your stay!"
];

function Welcomer(client, serverID) {
    client.on('any', function handleWelcomerEvent(event) {
        return  (event.t === 'GUILD_MEMBER_ADD' && event.d.guild_id === serverID) ?
                (setTimeout( welcome, 3000, client, event.d.user.id ), true) :
                false;
    });
}

module.exports = Welcomer;

function welcome(client, userID) {
    client.sendMessage({
        to: userID,
        message: message.join("\n")
    }, function(err, res) {
        if (err) return info(JSON.stringify(err));
    });
}