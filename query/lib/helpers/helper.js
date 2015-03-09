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
    getS3Aws: function () {
        var awsConfig = require('../../config/settings').aws; 
        var AWS = require('aws-sdk');
        var credentials = new AWS.SharedIniFileCredentials({profile: awsConfig.credentials});
        AWS.config.credentials = credentials;
        AWS.config.update({region: awsConfig.region});
        var s3 = new AWS.S3(awsConfig.apiVersion);
        return s3;
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
    getS3FileLastModified: function (key, res) {
        var s3 = self.getS3Aws();
        var awsConfig = require('../../config/settings').aws; 
        var params = {Bucket: awsConfig.bucketName, Key: awsConfig.s3PathPrefixCsvFiles+key};
        //
        s3.getObject(params,  function(err, data) {
          var status = 200;
          var ret = {};
          var exists = false;

          if (err) {
            if (err.statusCode != 404) {
                status = 500;
                ret.error = err;
                console.log(err, err.stack); // an error occurred
            }
          }
          else {
            exists = true;
            ret.mtime = data.LastModified;
          }
          ret.exists = exists;
          res.status(status).json(ret);

        });
    },
    getCsvName: function (key) {
        return "export_"+key+".csv";
    },
    putS3FileLastModified: function (key, csv, res) {
        var s3 = self.getS3Aws();
        var awsConfig = require('../../config/settings').aws; 

        var params = {Bucket: awsConfig.bucketName, Key: awsConfig.s3PathPrefixCsvFiles+key, Body: csv};
        //
        s3.putObject(params,  function(err, data) {
          var status = 200;
          var ret = {};
          var ok = false;

          if (err) {
            status = 500;
            ret.error = err;
            console.log(err, err.stack); // an error occurred
          }
          else {
            ok = true;
          }
          ret.ok = ok;
          res.status(status).json(ret);

        });
    },
    exportToCSV:  function (dataJson, tableName, res) {
            
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
        var json2csv = require('json2csv');
        json2csv({data: dataJson, fields: fieldDef}, function(err, csv) {
          if (err) console.log(err);
          else {
            var filename = self.getCsvName(tableName);
            self.putS3FileLastModified(filename, csv, res);
          }
            
        });
    }
}
module.exports = self;