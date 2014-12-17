module.exports = function (router, passport) {

    var helper = require('../lib/helpers/helper.js');
    router.get('/', helper.isAuthenticated, function(req, res) {
      res.redirect('/dashboard');
    });

    router.get('/login', function (req, res) {


        var e_messages = req.flash();
        var errorMessage = "";
        var infoMessage = "";
        if (typeof e_messages !== 'undefined') {
            if (typeof e_messages.error !== 'undefined' && e_messages.error.length > 0)
                errorMessage = e_messages.error[e_messages.error.length - 1];
            if (typeof e_messages.info !== 'undefined' && e_messages.info.length > 0)
                infoMessage = e_messages.info[e_messages.info.length - 1];
        }
        if (req.user) {
            res.redirect('/dashboard');
        } else {
            res.render('index', {
                "message": errorMessage, "messageInfo": infoMessage, title: 'UOC Learning Analytics'
            });
        }
    });


    router.get('/logout', function (req, res) {
        req.flash('info', 'The user is logout');
        req.logout();
        res.redirect('/login');
    });    

    // Render the dashboard page.
    router.get('/dashboard', helper.isAuthenticated, function (req, res) {
      var collections = require('../config/settings').collections; 
      res.render('dashboard', {title: 'Dashboard', user: req.user, 'collections': collections});
    });

    // Consolidate all data
    router.post('/consolidate_data', helper.isAuthenticated, function (req, res) {
      var collections = require('../config/settings').collections;
      var mongojs = require('mongojs');
      var config = require('../config/settings').settings;
      var dbConf = require('../config/settings').db;
      var collections_destination = [];
      if (dbConf.prefix_consolidated) {
        var BSON = require("mongodb").BSONPure;
        collections.forEach(function(collection){
          var destination_collection = dbConf.prefix_consolidated+collection;
          collections_destination.push(destination_collection);
        });
        var all_collections = collections.concat(collections_destination);
        var db = mongojs(config.db_connection_url, all_collections);
        collections.forEach(function(collection){
          if (collection!=config.source_collection){
            var destination_collection = eval('db.'+dbConf.prefix_consolidated+collection);
            var source_collection = eval('db.'+collection);
            //destination_collection.delete({});
            destination_collection.runCommand("{delete({})}");
            var cursor = source_collection.find();
            cursor.forEach(function(err, item) {
              // If the item is null then the cursor is exhausted/empty and closed
              if(item == null) {

              } else {
                item.key = item._id;
                item._id= new BSON.ObjectID();
                destination_collection.insert(item);
              }
            });
          }
            //source_collection.runCommand(eval("{find().forEach(function(doc){ doc.key = doc._id; doc._id=ObjectId();db."+dbConf.prefix_consolidated+collection+".insert(doc);});}"));
            //eval("db."+collection+".find().forEach(function(doc){ doc.key = doc._id; doc._id=ObjectId();db."+destination_collection+".insert(doc);});");
        });
        
      }
      else {
        res.status(500).json(false);    
      }
    });
    // Render the dashboard page.
    router.post('/dashboard', helper.isAuthenticated, function (req, res) {
      var hostArray = req.get('host').split(":");
      if (hostArray.length==1) {
        hostArray[1] = 80;
      } else {
        hostArray[1] = parseInt(hostArray[1], 10);
      }
      var settings = require('../config/settings').settings; 
      var db = require('../config/settings').db; 
      
      var from = parseInt((req.body.from)?req.body.from:0,10);
      var limit = parseInt((req.body.limit)?req.body.limit:50,10);
      var collection =  (req.body.collection && req.body.collection.length>0)?req.body.collection:settings.source_collection;
      if (db.prefix_consolidated) {
        collection = db.prefix_consolidated + collection;
      }
      var query = '/'+db.dbName+'/'+ collection + '?' + ((req.body.query && req.body.query.length>0) ?"query="+encodeURIComponent("{"+req.body.query+"}"):'');
      var url = req.protocol + '://' + hostArray[0] + ":" + (hostArray[1]+1) + query+'&limit='+limit+'&skip='+from;
      //var url = req.protocol + '://' + hostArray[0] + ":" + (hostArray[1]+1) + '/lrs/statements';
      console.log("Query "+url);
      var Client = require('node-rest-client').Client;

      var client = new Client();

        // set content-type header and data as json in args parameter
        client.get(url, function (data, response) {
          if (data && data.length>0) {
        		var hljs = require('highlight.js');
           	code = hljs.highlight('json', data);
           	var result = {
              		content: code.value
            };
            res.status(200).json(result);
        	} else {
        		res.status(404).json({error:'Not found'});
        	}
        }).on('error', function (err) {
            if (err.code == 'ECONNREFUSED') {
                console.warn('Can\'t connect to ' + url + ' review the configuration', err);
            } else {
                console.warn('Error connection to ' + url, err);
            }
            res.status(500).json(err);
        });
      
    });


    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    router.get('/signup', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup', { message: req.flash('signupMessage'), title: 'UOC Learning Analytics - Register' });
    });

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)

    router.get('/profile', helper.isAuthenticated, function (req, res) {
        res.render('profile', {
            user: req.user // get the user out of session and pass to template
        });
    });

    router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
      function(req, res) {
        res.redirect('/');
      });

    router.post('/signup', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }));

    router.get('/error_not_authenticated',
        function (req, res) {
            res.render('error', { title: 'Error', message: 'User is not authenticated'});
        }
    );
    
};
