var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var logger = require('morgan');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var session = require('express-session');
var mongodb = require("mongodb");
var i18n = require("i18next");
var path = require('path');
var fs = require("fs");
var restify = module.exports.restify = require("restify");
var MongoStore = require('connect-mongo')(session);
i18n.init({ useCookie: true, preload: ['ca-ES', 'es-ES', 'en'], fallbackLng: 'en'  });
var settings = require('./config/settings').settings; 
var db = require('./config/settings').db; 
var cluster = require('cluster');


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    if (user) {
      done(err, user);
    } else {
      findByUsernameDB(id, function (err, user) {
      if (user) {
        done(err, user);
        } 
       }
      );
    }

  });
});
var users = [
    { id: 1, name: 'Administrador', username: 'admin', password: 'secret', email: 'admin@uoc.edu' }
  , { id: 2, name: 'Joe', username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(null, null);
    //fn(new Error('User ' + id + ' does not exist'), null);
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

/**
 * Find user by id
 * @param  {[type]}   username [description]
 * @param  {Function} fn       [description]
 * @return {[type]}            [description]
 */
function findByUsernameDB(username, fn) {
    var User = require('./lib/entities/user');
    User.findById(username, function (err, user) {
      if (err) {
          return fn(null, null);
      } else {
          
        return fn(null, user);
      }
    })
}

passport.use(passport.session()); // persistent login sessions


passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { 
    //      return done(null, false, { message: 'Unknown user ' + username }); 
          findByUsernameDB(username, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
      //      if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
            return done(null, user);
          })

        }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));


var app = express();
var router = express.Router();

var routerJS = require('./routes/router')(router, passport);

app.use(favicon(__dirname + '/public/images/favicon.ico'));

// view engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


//Added REST interface
var DEBUGPREFIX = "DEBUG: ";
var config = {
  "db": {
    "port": db.dbPort,
    "host": db.dbHost
  },
  "flavor": "mongodb",
  "debug": false
};

var debug = module.exports.debug = function (str) {
  if (config.debug) {
    console.log(DEBUGPREFIX + str);
  }
};

var server = restify.createServer({
  name: "crest"
});
server.acceptable = ['application/json'];
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.jsonp());
module.exports.config = config;
module.exports.server = server;

require('./lib/rest');


//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(i18n.handle);

i18n.registerAppHelper(app)
    .serveClientScript(app);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules/highlight.js/styles'));

var mongooseInit = require('./config/mongo'); //will hold our database connection settings
mongooseInit.connect('mongodb://'+db.dbHost+'/'+db.dbName);

var store = new MongoStore({
    db: db.dbName,
    autoReconnect: true,
    host: db.dbHost,
    w: 1,
    expireAfter: 3600000*24*2,
    clear_interval: 3600
}, function(ret){
  console.log(err || 'connect-mongodb setup ok');
});
    // START THE SERVER -- WAIT FOR DB CONNECTION
    // =============================================================================
    if (cluster.isMaster) {
        var numCPUs = require('os').cpus().length;
        //Fork the workers, one per CPU
        for (var i=0; i< numCPUs; i++) {
            cluster.fork();
        }
        console.log("Forking UOC Learning Analytics " + i + " child processes");
        cluster.on('exit', function(deadWorker, code, signal) {
            // Catch dead worker and restart
            console.log('worker %d died (%s). restarting...', deadWorker.process.pid, signal || code);
            // var worker = cluster.fork();
       });

    } else {


        module.exports = app;

        var port = process.env.PORT || 8080; // set our port

        // START THE SERVER
        // =============================================================================
        app.listen(port);
        console.log('Starting UOC Learning Analytics ' + port);

		// 
		server.listen(port+1, function () {
		  console.log("%s listening at %s", server.name, server.url);
		});

    }


app.use(session({ 
    secret:'DEd/gu=NJ2VZgP9w',
    name: 'uoclearninganlytics.sid',
    cookie: { maxAge: 3600000*24*2},
    store: store,
    saveUninitialized: true,
    resave: true 
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


app.use('/', router);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found '+req.url);
    err.status = 404;
    next(err);
});

// Keep session up-to-date
app.use(function(req, res, next) {
  req.session._garbage = Date();
  req.session.touch();
  next();
});
