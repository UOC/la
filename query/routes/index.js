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
          var ret = {};
          ret.itemCount = data.Table.ItemCount;
          ret.provisionedThroughput = data.Table.ProvisionedThroughput;
          ret.tableSizeBytes = data.Table.TableSizeBytes;
          ret.attributes = data.Table.AttributeDefinitions;

          if (data.Table.KeySchema) {
            for(var i=0; i<data.Table.KeySchema.length; i++) {
              for (var j=0; j<ret.attributes.length; j++) {
                if (ret.attributes[j].AttributeName==data.Table.KeySchema[i]){
                  ret.attributes[j].isKey = true;
                }
              }
            }
          }
          res.status(200).json(ret);
        } else {
          res.status(500).json(err);
        }
      });
    });
    // Render the dashboard page.
    router.post('/dashboard', helper.isAuthenticated, function (req, res) {

      var tableName = (req.body.tableName)?req.body.tableName:'';
      var query = (req.body.query)?req.body.query:'';
      var export_to_csv = (req.body.export_to_csv)?req.body.export_to_csv=='1':false;
      var itemsCount = (req.body.itemsCount)?req.body.itemsCount:0;
      //console.log(req.body);
      //var sort = (req.body.sort)?req.body.sort:'';
      //var sort_order = parseInt((req.body.sort_order)?req.body.sort_order:0,10);

      var lastEvaluatedKey = (req.body.lastEvaluatedKey)?req.body.lastEvaluatedKey:'';
      var limit = parseInt((req.body.limit)?req.body.limit:50,10);
      if (export_to_csv) {
        limit = itemsCount;
        lastEvaluatedKey = '';
      }
      var dynamodb = new helper.getDynamoAws();
      var go_forward = req.body.go_forward?req.body.go_forward=='true':true;
      var is_advanced_search = req.body.is_advanced_search?req.body.is_advanced_search=='true':false;
      var params = {};
      var advanced_search = is_advanced_search && req.body.advanced_search?req.body.advanced_search:[];
      var use_query = req.body.operation?req.body.operation=='query':false;
      if (is_advanced_search && advanced_search.length>0 && use_query) {
        //using query

        params = {
          TableName: tableName, /* required */
          //ConsistentRead: true, Not supported on secondaty indexes
          Limit: limit,
          ReturnConsumedCapacity: 'TOTAL',//INDEXES | TOTAL | NONE',
          Select: 'ALL_ATTRIBUTES'//'ALL_ATTRIBUTES | ALL_PROJECTED_ATTRIBUTES | SPECIFIC_ATTRIBUTES | COUNT',
        };
        if (lastEvaluatedKey!='') {
            params['ExclusiveStartKey'] = lastEvaluatedKey;
        }
        var number_of_conditions = 0;
        var params_filter = [];
        for (var i=0; i<advanced_search.length; i++) {
          if (advanced_search[i].value.length>0) {
              params_filter[advanced_search[i].id] = {
                    ComparisonOperator: 'EQ',// | NE | IN | LE | LT | GE | GT | BETWEEN | NOT_NULL | NULL | CONTAINS | NOT_CONTAINS | BEGINS_WITH', // required 
                    AttributeValueList: [ { // AttributeValue 
                      S:  advanced_search[i].value,
                    }]
                  };
                  //console.log("FILTER ",params_filter[advanced_search[i].id]);
                  number_of_conditions ++;
                }
          }
          if (params_filter.length>1) {
            params_filter['ConditionalOperator'] = 'AND';
          }
        params['KeyConditions']= params_filter;
        //console.log(params);
      dynamodb.query(params, function(err, data) {
        
        if (!err) {
          //console.log("Returned items "+data.Items.length);
          //console.log("Items ", data.Items);
          if (export_to_csv) {
            helper.exportToCSV(data.Items, tableName, res);
          } else {
            res.status(200).json(data);
          }

        } else {
          console.error(err);
          res.status(500).json(err);
        }
      });
    } else {
      params = {
          TableName: tableName, /* required */
          Limit: limit,
          ReturnConsumedCapacity: 'TOTAL',//INDEXES | TOTAL | NONE',          
          Segment: 0,
          Select: 'ALL_ATTRIBUTES',//'ALL_ATTRIBUTES | ALL_PROJECTED_ATTRIBUTES | SPECIFIC_ATTRIBUTES | COUNT',
          TotalSegments: 1
        };
        if (lastEvaluatedKey!='') {
            params['ExclusiveStartKey'] = lastEvaluatedKey;
        }
        var number_of_conditions = 0;
        if (is_advanced_search && advanced_search.length>0) {
          var params_filter = [];
          for (var i=0; i<advanced_search.length; i++) {
            if (advanced_search[i].value.length>0) {
                params_filter[advanced_search[i].id] = {
                      ComparisonOperator: 'EQ',// | NE | IN | LE | LT | GE | GT | BETWEEN | NOT_NULL | NULL | CONTAINS | NOT_CONTAINS | BEGINS_WITH', // required 
                      AttributeValueList: [ { // AttributeValue 
                        S:  advanced_search[i].value,
                      }]
                    };
                    //console.log("FILTER ",params_filter[advanced_search[i].id]);
                    number_of_conditions ++;
                  }
            }
          params['ScanFilter'] = params_filter;
        }
        if (number_of_conditions>1) {
            params['ConditionalOperator'] = 'AND';
        }
        //console.log(params);
        dynamodb.scan(params, function(err, data) {
        
        if (!err) {
          //console.log("Returned items "+data.Items.length);
          //console.log("Items ", data.Items);
          if (export_to_csv) {
            helper.exportToCSV(data.Items, tableName, res);
          } else {
            res.status(200).json(data);
          }

        } else {
          console.error(err);
          res.status(500).json(err);
        }
      });
     }
    });

    // Render the dashboard page.
    router.post('/get_services', function (req, res) {

      var tableName = 'learnginAnalyticsServiceSemester';
      var service = (req.body.service)?req.body.service:'';
      var semester = (req.body.semester)?req.body.semester:'';
      var limit = 0;
      var dynamodb = new helper.getDynamoAws();
      var params = {
          TableName: tableName, /* required */
          //ConsistentRead: true, Not supported on secondaty indexes
          //Limit: limit,
          ReturnConsumedCapacity: 'TOTAL',//INDEXES | TOTAL | NONE',
          Select: 'ALL_ATTRIBUTES'//'ALL_ATTRIBUTES | ALL_PROJECTED_ATTRIBUTES | SPECIFIC_ATTRIBUTES | COUNT',
      };
      var number_of_conditions = 0;

      var params_filter = [];
      var service_array = service.split(",");
      for (var i=0; i<service_array.length; i++) {
        if (service_array[i].length>0) {
            params_filter['service'] = {
                  ComparisonOperator: 'EQ',// | NE | IN | LE | LT | GE | GT | BETWEEN | NOT_NULL | NULL | CONTAINS | NOT_CONTAINS | BEGINS_WITH', // required 
                  AttributeValueList: [ { // AttributeValue 
                    S:  service_array[i],
                  }]
                };
                number_of_conditions ++;
              }
      }
      var semester_array = semester.split(",");
      for (var i=0; i<semester_array.length; i++) {
        if (semester_array[i].length>0) {
            params_filter['semester'] = {
                  ComparisonOperator: 'EQ',// | NE | IN | LE | LT | GE | GT | BETWEEN | NOT_NULL | NULL | CONTAINS | NOT_CONTAINS | BEGINS_WITH', // required 
                  AttributeValueList: [ { // AttributeValue 
                    S:  semester_array[i],
                  }]
                };
                number_of_conditions ++;
              }
        }
        if (number_of_conditions>0) {
          params['ScanFilter']= params_filter;
          if (number_of_conditions>1) {
              params['ConditionalOperator'] = 'AND';
          }
        }

      dynamodb.scan(params, function(err, data) {
        
        if (!err) {
            var return_data = {};
            return_data.Count = data.Count;
            return_data.Items = data.Items;
            res.status(200).json(return_data);

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
      //console.log("Query "+url);
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
/*    router.get('/existCSV/:tableName', helper.isAuthenticated, function (req, res) {
      var fs = require('fs');
      var tableName = req.params["tableName"];
      var path = 'tmp/export_'+tableName+'.csv';
      fs.exists(path, function(exists) {
        var ret = {};
        ret.exists = exists;
        if (exists) {
            var stats = fs.statSync(path);
            ret.mtime = stats.mtime;
        }
        res.status(200).json(ret);
      });
      
    });*/
    router.get('/existCSV/:tableName', helper.isAuthenticated, function (req, res) {
      var fs = require('fs');
      var tableName = req.params["tableName"];
      helper.getS3FileLastModified(helper.getCsvName(tableName), res);
      /*
      var path = 'tmp/export_'+tableName+'.csv';
      fs.exists(path, function(exists) {
        var ret = {};
        ret.exists = exists;
        if (exists) {
            var stats = fs.statSync(path);
            ret.mtime = stats.mtime;
        }
        res.status(200).json(ret);
      });
      */
    });
    router.get('/getCSV/:tableName', helper.isAuthenticated, function (req, res) {
      var fs = require('fs');
      var tableName = req.params["tableName"];
      var path = 'tmp/export_'+tableName+'.csv';
      fs.exists(path, function(exists) {
        var ret = {};
        ret.exists = exists;
        if (exists) {
            res.sendfile(path);
        }
        else {
          res.status(500).json('File can not found!');
        }
        
      });
      
    });
    
};
