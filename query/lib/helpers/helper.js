var self = {
    isAuthenticated: function (req, res, next) {

        // do any checks you want to in here

        // CHECK THE USER STORED IN SESSION FOR A CUSTOM VARIABLE
        // you can do this however you want with whatever variables you set up
        if (req.isAuthenticated())
            return next();

        // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
        res.redirect('/error_not_authenticated');
    },
    getDynamoAws: function () {
		var awsConfig = require('../../config/settings').aws; 
		var AWS = require('aws-sdk');
		var credentials = new AWS.SharedIniFileCredentials({profile: awsConfig.credentials});
		AWS.config.credentials = credentials;
		AWS.config.update({region: awsConfig.region});
		var dynamodb = new AWS.DynamoDB(awsConfig.apiVersion);
		return dynamodb;
    },
    cleanObject: function (obj, fields) {
        for (var i=0; i<fields.length; i++) {
            if (eval("obj."+fields[i])) {
                if (eval("obj."+fields[i]+".S")){
                    eval("obj."+fields[i]+" = obj."+fields[i]+".S");
                } else {
                    if (eval("obj."+fields[i]+".N")){
                        eval("obj."+fields[i]+" = obj."+fields[i]+".N");
                    }

                }
            }
        }
        return obj;
    },
    exportToCSV:  function (dataJson, tableName, res) {
        var mkdirp = require('mkdirp');
        mkdirp('tmp', function (err) {
            
            var fieldDef = ['service', 'resource', 'result', 'time', 'user'];
            switch (tableName) {
                case 'learningAnalyticsCountStudies':
                  fieldDef = ['failed','total','result','study','passed'];
                  break;
                case 'learningAnalyticsCountSubjectsSemester':
                  fieldDef = ['semester','result'];
                  break;
                case 'learningAnalyticsCountSubjectsUser':
                  fieldDef = ['semester','result','user'];
                  break;
                case 'learningAnalyticsSubjectSemester':
                  fieldDef = ['semester','subject','failed','total','result','passed'];
                  break;
            }
            for (var i=0; i<dataJson.length; i++){ 
                dataJson[i] = self.cleanObject(dataJson[i], fieldDef);
            }
//            console.log("fields ",fieldDef);
            var json2csv = require('json2csv');
            json2csv({data: dataJson, fields: fieldDef}, function(err, csv) {
              if (err) console.log(err);
              else {
                var fs = require('fs');
                var filename = 'export_'+tableName+'.csv';
                if (fs.existsSync('tmp/'+filename)){
                    var now = new Date();
                    fs.renameSync('tmp/'+filename, 'tmp/'+filename+'_'+now.toJSON());
                }
                
                fs.writeFile('tmp/'+filename, csv);
                ret = {};
                ret.filename = 'tmp/'+filename;
                res.status(200).json(ret);
              }
            });

            
        });
    }
}
module.exports = self;