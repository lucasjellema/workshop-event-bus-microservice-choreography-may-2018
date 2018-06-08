//respond to HTTP requests with response: count of number of requests
// invoke from browser or using curl:  curl http://127.0.0.1:PORT
var http = require('http'), express = require('express');
var os = require("os");
var hostname = os.hostname();

var requestCounter = 0;
var version = "v1";

var PORT = process.env.APP_PORT || 3000;
var dead = false;


var app = express();
var server = http.createServer(app);

server.listen(PORT, function () {
    console.log('Server running, version ' + version + ', Express is listening... at ' + PORT + " for Request Counter calls");
});

console.log('server running on port ' + PORT);

app.get('/ready', function (req, res) {
    if (!dead) {
        res.statusCode = 200;
        res.send("Alive and kicking");
    } else {
        res.statusCode = 400;
        res.send("Dead as a dodo!");
    }
})


app.get('/health', function (req, res) {
    if (!dead) {
        res.statusCode = 200;
        res.send("Alive and kicking");
    } else {
        res.statusCode = 400;
        res.send("Dead as a dodo!");
    }
})

app.get('/kill', function (req, res) {
    if (!dead) {
        dead = true
        res.statusCode = 200;
        res.send("Killed the request counter at host "+hostname);
    } else {
        res.statusCode = 200;
        res.send("Was already dead: request counter at host "+hostname);
    }
})


app.get('/', function (req, res) {
    if (!dead) {
        res.statusCode = 200;
        res.write('Request Count: ' + ++requestCounter+'\n');
        res.write('Response from Version Request Count: ' + version+'\n');
        res.write('Response from Host : ' + hostname+'\n');
        res.end();
    } else {
        res.statusCode = 400;
        res.send("Dead as a dodo!");
    }
})
