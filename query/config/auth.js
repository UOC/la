//to do this file will store the secret keys to LTI

var config = {};

config.imslti = Array();
//the field concat_course_key as default concats the over the conctext_id and resource_link the consumer_key if you set to false it doesn't  
config.imslti[config.imslti.length] = {consumer_key : '12345', consumer_secret: 'test', concat_consumer_key: false, show_terms_conditions: true};

module.exports = config;
