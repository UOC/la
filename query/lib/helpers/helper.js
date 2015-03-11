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
    getLTIValue: function (provider, param_name, decode_base64) {

        var keys_no_encode = ["lti_version", "lti_message_type", "tool_consumer_instance_description", "tool_consumer_instance_guid",
            "oauth_consumer_key", "custom_lti_message_encoded_base64", "oauth_nonce", "oauth_version", "oauth_callback", "oauth_timestamp", "basiclti_submit", "oauth_signature_method",
            "oauth_signature", "custom_lti_message_encoded_utf8", "custom_lti_message_encoded_iso", "ext_ims_lis_memberships_url", "ext_ims_lis_memberships_id", "ext_ims_lis_basic_outcome_url", "ext_ims_lti_tool_setting_url", "launch_presentation_return_url" ];
        var value = eval("provider.body." + param_name);

        if (value !== undefined && decode_base64 && !keys_no_encode[param_name]) {
            var base64_decode = require('base64').decode;

            var temp_value = new Buffer(value, 'base64');
            //We do it because the roles parameter doesn't decode well and we use the base64_decode (but base64_decode doesn't decode tilde well, such us é)
            ////Or param name roles has to decode using the library, why?!?!?!? I don't know because doesn't works
            if (param_name === 'roles' || temp_value.length == 0 || temp_value == undefined) {
                value = base64_decode(value).toString('utf8');//new Buffer(value, 'base64').toString('utf8');
            } else {
                value = temp_value.toString('utf8');
            }
        }
        return value;
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