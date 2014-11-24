var mongojs = require('mongojs');
var lrsconfig = require('./config/lrs').settings;
var lrsdb = mongojs(lrsconfig.db_connection_url, ['statements', 'byactivity']);

var config = require('./config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, 'byactivity']);

var lrs = {};

lrs.byClassroom = function(callback) {

	lrsdb.runCommand({
		aggregate: "statements",
		pipeline: [
			{ $match: { 'context.extensions.uoc:lrs:subject:id': { $exists: true } } },
			{ $group: {
				_id: {
					'edu:uoc:la:user:idp': '$actor.account.name',
					'edu:uoc:la:subject:code': '$context.extensions.uoc:lrs:subject:id',
					'edu:uoc:la:classroom:code': '$context.extensions.uoc:lrs:classroom:id',
					'edu:uoc:la:activity:code': '$context.extensions.uoc:lrs:activity:id'
				},
				count: { $sum: 1 },
				first: { $first: "$stored" },
				last: { $last: "$stored" }
			}},
			{ $sort: { count: -1 } }
		]
	}, function(err, aggregate) {
        if (err) return callback(err);
	    db.byactivity.remove(function(err, result) {
	        db.byactivity.insert(aggregate.result, function(err, result) {
	        	return callback(err, result);
	        });
	    });
	});
};

module.exports = lrs;

lrs.byClassroom(function(err, result) {
    if (err) console.log(err);
    process.exit();
});