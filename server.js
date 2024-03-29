//  OpenShift sample Node application
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

var mainRouter = require('./routes/index'),
    apiRouter = require('./routes/api');

var express = require('express'),
    bodyParser = require('body-parser'),
    _path = require('path'),
    _fs = require('fs'),
    eps = require('ejs'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    app = express();

Object.assign = require('object-assign')

//app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', mainRouter);
app.use('/api', apiRouter);

// Config URL MongoDB
if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
        mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
        mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
        mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
        mongoPassword = process.env[mongoServiceName + '_PASSWORD']
    mongoUser = process.env[mongoServiceName + '_USER'];

    if (mongoHost && mongoPort && mongoDatabase) {
        mongoURLLabel = mongoURL = 'mongodb://';
        if (mongoUser && mongoPassword) {
            mongoURL += mongoUser + ':' + mongoPassword + '@';
        }
        // Provide UI label that excludes user id and pw
        mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
        mongoURL += mongoHost + ':' + mongoPort + '/' + mongoDatabase;

    }
}
var db = null,
    dbDetails = new Object();

// Connection MongoDB
var initDb = function(callback) {
    if (mongoURL == null) return;

    var mongodb = require('mongodb');
    if (mongodb == null) return;

    /*mongodb.connect(mongoURL, function(err, conn) {
        if (err) {
            callback(err);
            return;
        }
        db = conn;
        dbDetails.databaseName = db.databaseName;
        dbDetails.url = mongoURLLabel;
        dbDetails.type = 'MongoDB';
        console.log('Connected to MongoDB at: %s', mongoURL);
    });*/
    mongoose.connect(mongoURL, function(err) {
        if (err) {
            return err;
        } else {
            console.log('Successfully connected to ' + mongoURL);
        }
    });
};

app.set('views', __dirname + '/client/dist');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(_path.join(__dirname, 'client')));

//------------------------------------
/*app.get('/', function(req, res) {
    // try to initialize the db on every request if it's not already
    // initialized.
    if (!db) {
        initDb(function(err) {});
    }
    if (db) {
        var col = db.collection('counts');
        // Create a document with request IP and current time of request
        col.insert({ ip: req.ip, date: Date.now() });
        col.count(function(err, count) {
            res.render('index.html', { pageCountMessage: count, dbInfo: dbDetails });
        });
    } else {
        res.render('index.html', { pageCountMessage: null });
    }
});*/

app.get('/pagecount', function(req, res) {
    // try to initialize the db on every request if it's not already
    // initialized.
    if (!db) {
        initDb(function(err) {});
    }
    if (db) {
        db.collection('counts').count(function(err, count) {
            res.send('{ pageCount: ' + count + '}');
        });
    } else {
        res.send('{ pageCount: -1 }');
    }
});

// error handling
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something bad happened!');
});

initDb(function(err) {
    console.log('Error connecting to Mongo. Message:\n' + err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;