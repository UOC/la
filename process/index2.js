// AWS
var AWS = require('aws-sdk');
var config = require('./config/settings').settings;

var credentials = new AWS.SharedIniFileCredentials();

AWS.config.credentials = credentials;
AWS.config.update({region: config.aws_region});

// Main class
// var modules = ["aepresposta", "matriculat", "assmatr", "login", "matricula"];
var modules = ["assmatr"];
for (var i = 0; i < modules.length; i++) {
  require("./processors/" + modules[i]).execute(AWS);
}
