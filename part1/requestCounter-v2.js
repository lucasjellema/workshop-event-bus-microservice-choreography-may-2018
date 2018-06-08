//respond to HTTP requests with response: count of number of requests
// invoke from browser or using curl:  curl http://127.0.0.1:PORT
var http = require('http'), express = require('express');
var os = require("os");
var Redis = require("redis");

var hostname = os.hostname();

var version = "v2";

var PORT = process.env.APP_PORT || 3000;
var REDIS_HOST = process.env.REDIS_HOST || 'redis-master';
var REDIS_PORT = process.env.REDIS_PORT || 6379;
var dead = false;
var redisKeyRequestCounter = "requestCounter";


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
        increment(redisKeyRequestCounter, function (err, newValue) {
            if (err) {
                res.statusCode = 500;
                res.write('Request Count : ERROR ' + err);
                res.write('Response from Version Request Count: ' + version+'\n');
                res.write('Response from Host : ' + hostname+'\n');
                res.end();
            } else {
                res.statusCode = 200;
                res.write('Request Count: ' + newValue+'\n');
                res.write('Response from Version Request Count: ' + version+'\n');
                res.write('Response from Host : ' + hostname+'\n');
                res.end();
                    }
        })
    

    } else {
        res.statusCode = 400;
        res.send("Dead as a dodo!");
    }
})


function _increment(key, cb) {
    var replied = false;
    var newValue;

    var redis = Redis.createClient({ "host": REDIS_HOST, "port": REDIS_PORT });
    // if the key does not yet exist, then create it with a value of zero associated with it
    redis.setnx(key, 0);
    redis.once('error', done);
    // ensure that if anything changes to the key-value pair in Redis (from a different connection), this atomic operation will fail
    redis.watch(key);
    redis.get(key, function (err, value) {
        if (err) {
            return done(err);
        }
        newValue = Number(value) + 1;
        // either watch tells no change has taken place and the set goes through, or this action fails
        redis.multi().
            set(key, newValue).
            exec(done);
    });

    function done(err, result) {
        redis.quit();

        if (!replied) {
            if (!err && !result) {
                err = new Error('Conflict detected');
            }

            replied = true;
            cb(err, newValue);
        }
    }
}

function increment(key, cb) {
    _increment(key, callback);

    function callback(err, result) {
        if (err && err.message == 'Conflict detected') {
            _increment(key, callback);
        }
        else {
            cb(err, result);
        }
    }
}
