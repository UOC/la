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
      res.render('dashboard', {title: 'Dashboard', user: req.user, 'collections': []});
    });
    /**
     * List tables
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     * @return {[type]}     [description]
     */
    router.get('/listTables', function (req, res) {
      var dynamodb = new helper.getDynamoAws();
      dynamodb.listTables(function(err, data) {
        if (!err) {
          res.status(200).json(data.TableNames);    
        } else {
          res.status(500).json(err);
        }
      });
    });
    /**
     * Describe table
     * @param  {[type]} req [description]
     * @param  {[type]} res [description]
     * @return {[type]}     [description]
     */
    router.get('/describeTable/:tableName', function (req, res) {
      var dynamodb = new helper.getDynamoAws();
      var tableName = req.params["tableName"];
      var params = {
        TableName: tableName /* required */
      };
      dynamodb.describeTable(params, function(err, data) {
        if (!err) {
          res.status(200).json(data.Table.AttributeDefinitions);    
        } else {
          res.status(500).json(err);
        }
      });
    });
    // Render the dashboard page.
    router.post('/dashboard', helper.isAuthenticated, function (req, res) {

      var tableName = (req.body.tableName)?req.body.tableName:'';
      var query = (req.body.query)?req.body.query:'';
      //var sort = (req.body.sort)?req.body.sort:'';
      //var sort_order = parseInt((req.body.sort_order)?req.body.sort_order:0,10);

      var lastEvaluatedKey = (req.body.lastEvaluatedKey)?req.body.lastEvaluatedKey:'';
      var limit = parseInt((req.body.limit)?req.body.limit:50,10);
      var dynamodb = new helper.getDynamoAws();
      var go_forward = req.body.go_forward?req.body.go_forward=='true':true;
      var params = {
          TableName: tableName, /* required */
          /*AttributesToGet: [
            'STRING_VALUE',
            
          ],
          ConditionalOperator: 'AND | OR',*/
          /*ExclusiveStartKey: {
            someKey: { // AttributeValue 
              B: new Buffer('...') || 'STRING_VALUE',
              BOOL: true || false,
              BS: [
                new Buffer('...') || 'STRING_VALUE',
                // more items 
              ],
              L: [
                // recursive AttributeValue ,
                // more items 
              ],
              M: {
                someKey: // recursive AttributeValue ,
                // anotherKey: ... 
              },
              N: 'STRING_VALUE',
              NS: [
                'STRING_VALUE',
                // more items 
              ],
              NULL: true || false,
              S: 'STRING_VALUE',
              SS: [
                'STRING_VALUE',
                // more items 
              ]
            },
            // anotherKey: ... 
          },*/
          /*ExpressionAttributeNames: {
            someKey: 'STRING_VALUE',
            // anotherKey: ... 
          },
          ExpressionAttributeValues: {
            someKey: { // AttributeValue 
              B: new Buffer('...') || 'STRING_VALUE',
              BOOL: true || false,
              BS: [
                new Buffer('...') || 'STRING_VALUE',
                // more items 
              ],
              L: [
                // recursive AttributeValue ;
                // more items 
              ],
              M: {
                someKey: /() recursive AttributeValue ,
                // anotherKey: ... 
              },
              N: 'STRING_VALUE',
              NS: [
                'STRING_VALUE',
                // more items 
              ],
              NULL: true || false,
              S: 'STRING_VALUE',
              SS: [
                'STRING_VALUE',
                 //more items 
              ]
            },
            // anotherKey: ... 
          },
          FilterExpression: 'STRING_VALUE',*/
          Limit: limit,
          /*ProjectionExpression: 'STRING_VALUE',*/
          ReturnConsumedCapacity: 'TOTAL',//INDEXES | TOTAL | NONE',
          /*ScanFilter: {
            someKey: {
              ComparisonOperator: 'EQ | NE | IN | LE | LT | GE | GT | BETWEEN | NOT_NULL | NULL | CONTAINS | NOT_CONTAINS | BEGINS_WITH', // required 
              AttributeValueList: [
                { // AttributeValue 
                  B: new Buffer('...') || 'STRING_VALUE',
                  BOOL: true || false,
                  BS: [
                    new Buffer('...') || 'STRING_VALUE',
                    // more items 
                  ],
                  L: [
                    // recursive AttributeValue ,
                    // more items 
                  ],
                  M: {
                    someKey: // recursive AttributeValue ,
                    // anotherKey: ... 
                  },
                  N: 'STRING_VALUE',
                  NS: [
                    'STRING_VALUE',
                    // more items 
                  ],
                  NULL: true || false,
                  S: 'STRING_VALUE',
                  SS: [
                    'STRING_VALUE',
                    // more items 
                  ]
                },
                // more items 
              ]
            },
            // anotherKey: ... /
          },*/
          Segment: 0,
          Select: 'ALL_ATTRIBUTES',//'ALL_ATTRIBUTES | ALL_PROJECTED_ATTRIBUTES | SPECIFIC_ATTRIBUTES | COUNT',
          TotalSegments: 4
        };
        if (lastEvaluatedKey!='') {
            params['ExclusiveStartKey'] = lastEvaluatedKey;
        }
        console.log(params);
      dynamodb.scan(params, function(err, data) {
        
        if (!err) {
          /*var array = [];
          var hljs = require('highlight.js');
          for(i=0;i<data.Items.length; i++){
            var code = hljs.highlight('json', data.Items[i]);
            array[i] = code;
          }
          //var code =  data.Items;
          var result = {
                content: array
          };*/

          res.status(200).json(data);

        } else {
          console.error(err);
          res.status(500).json(err);
        }
      });
    });
/**** M O N G O ****/
    // Render the dashboard page.
    router.get('/dashboardMongo', helper.isAuthenticated, function (req, res) {
      var collections = require('../config/settings').collections; 
      res.render('dashboardMongo', {title: 'Dashboard Mongo', user: req.user, 'collections': collections});
    });

    // Consolidate all data
    router.post('/consolidate_data', helper.isAuthenticated, function (req, res) {
      var collections = require('../config/settings').collections;
      var mongojs = require('mongojs');
      var config = require('../config/settings').settings;
      var dbConf = require('../config/settings').db;
      var collections_destination = [];
      var collection =  (req.body.collection && req.body.collection.length>0)?req.body.collection:'';
      if (collection != '') {
        collections = [collection];
      }
      if (dbConf.prefix_consolidated) {
        var BSON = require("mongodb").BSONPure;
        collections.forEach(function(collection){
          var destination_collection = dbConf.prefix_consolidated+collection;
          collections_destination.push(destination_collection);
        });
        var all_collections = collections.concat(collections_destination);
        var db = mongojs(config.db_connection_url, all_collections);
        var total_collections = collections.length;
        collections.forEach(function(collection){
          if (collection!=config.source_collection){
            var destination_collection = eval('db.'+dbConf.prefix_consolidated+collection);
            var source_collection = eval('db.'+collection);
            destination_collection.remove({}, false, function(err) {
              var cursor = source_collection.find();
              cursor.forEach(function(err, item) {
                // If the item is null then the cursor is exhausted/empty and closed
                if(item == null) {
                  total_collections--;
                  if (total_collections==0) {
                    res.status(200).json(true);    
                  }
                } else {
                  item.key = item._id;
                  item._id= new BSON.ObjectID();
                  destination_collection.insert(item);
                }
              });
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
    router.post('/dashboardMongo', helper.isAuthenticated, function (req, res) {
      var hostArray = req.get('host').split(":");
      if (hostArray.length==1) {
        hostArray[1] = 80;
      } else {
        hostArray[1] = parseInt(hostArray[1], 10);
      }
      var settings = require('../config/settings').settings; 
      var db = require('../config/settings').db; 
      
      var sort = (req.body.sort)?req.body.sort:'';
      var sort_order = parseInt((req.body.sort_order)?req.body.sort_order:0,10);

      var from = parseInt((req.body.from)?req.body.from:0,10);
      var limit = parseInt((req.body.limit)?req.body.limit:50,10);
      var collection =  (req.body.collection && req.body.collection.length>0)?req.body.collection:settings.source_collection;
      if (collection!=settings.source_collection && db.prefix_consolidated) {
        collection = db.prefix_consolidated + collection;
      }
      var query = '/'+db.dbName+'/'+ collection + '?' + ((req.body.query && req.body.query.length>0) ?"query="+encodeURIComponent("{"+req.body.query+"}"):'');
      var url = req.protocol + '://' + hostArray[0] + ":" + (hostArray[1]+1) + query+'&limit='+limit+'&skip='+from;
      if (sort!='') {
        url += '&sort='+encodeURIComponent(sort+':'+sort_order);
      }
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
