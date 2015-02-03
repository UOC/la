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
    }
}
module.exports = self;