/*Heroku requires some sort of webserver to be running.
Otherwise it just quits the script after 60 seconds.*/
var http = require('http');

var server = http.createServer(function(req, res) {
    res.end();
});
server.listen(process.env.PORT);