var mongojs = require('mongojs');
var lrsconfig = require('./config/lrs').settings;
var lrsdb = mongojs(lrsconfig.db_connection_url, ['statements']);

var config = require('./config/settings').settings;
var db = mongojs(config.db_connection_url, [config.source_collection, 'bytool', 'byclassroom', 'byresource']);

var tincanjs = require('tincanjs');

var lrs = {};

var convertToolStatement = function(statement) {

    var semester = '20141';

    return {
        actor: {
            account: {
                objectType: 'Agent',
                name: statement.actor.account.name
            }
        },
        verb: {
            id: 'http://la.uoc.edu/verb/classroomtoolaccess',
            display: {
                'en-US': 'Classroom tool access'
            }
        },
        object: {
            id: 'http://la.uoc.edu/object/classroom/tool/code/' + statement.object.definition.extensions['uoc:lrs:tool:id'],
            definition: {
                extensions: {
                    'edu:uoc:la:user': {
                        idp: statement.actor.account.name
                    },
                    'edu:uoc:la:semester': {
                        'code': semester
                    },
                    'edu:uoc:la:subject': {
                        domainid: statement.context.extensions['uoc:lrs:subject:id']
                    },
                    'edu:uoc:la:subject:classroom': {
                        domainid: statement.context.extensions['uoc:lrs:classroom:id']
                    },
                    'edu:uoc:la:tool': {
                        'id': statement.object.definition.extensions['uoc:lrs:tool:id'],
                        'type': statement.object.definition.type,
                        'name': statement.object.definition.name.ca
                    }
                }
            }
        }
    };
};

var convertResourceStatement = function(statement) {

    var semester = '20141';

    return {
        actor: {
            account: {
                objectType: 'Agent',
                name: statement.actor.account.name
            }
        },
        verb: {
            id: 'http://la.uoc.edu/verb/classroomresourceaccess',
            display: {
                'en-US': 'Classroom resource access'
            }
        },
        object: {
            id: 'http://la.uoc.edu/object/classroom/resource/code/' + statement.object.definition.extensions['uoc:lrs:material:id'],
            definition: {
                extensions: {
                    'edu:uoc:la:user': {
                        idp: statement.actor.account.name
                    },
                    'edu:uoc:la:semester': {
                        'code': semester
                    },
                    'edu:uoc:la:subject': {
                        domainid: statement.context.extensions['uoc:lrs:subject:id']
                    },
                    'edu:uoc:la:subject:classroom': {
                        domainid: statement.context.extensions['uoc:lrs:classroom:id']
                    },
                    'edu:uoc:la:resource': {
                        'id': statement.object.definition.extensions['uoc:lrs:material:id']
                    }
                }
            }
        }
    };
};

var convertClassroomStatement = function(statement) {

    var semester = '20141';

    return {
        actor: {
            account: {
                objectType: 'Agent',
                name: statement.actor.account.name
            }
        },
        verb: {
            id: 'http://la.uoc.edu/verb/classroomaccess',
            display: {
                'en-US': 'Classroom access'
            }
        },
        object: {
            id: 'http://la.uoc.edu/object/classroom/code/' + statement.context.extensions['uoc:lrs:classroom:id'],
            definition: {
                extensions: {
                    'edu:uoc:la:user': {
                        idp: statement.actor.account.name
                    },
                    'edu:uoc:la:semester': {
                        'code': semester
                    },
                    'edu:uoc:la:subject': {
                        domainid: statement.context.extensions['uoc:lrs:subject:id']
                    },
                    'edu:uoc:la:subject:classroom': {
                        domainid: statement.context.extensions['uoc:lrs:classroom:id']
                    },
                    'edu:uoc:la:subject:classroom:activity': {
                        eventId: statement.context.extensions['uoc:lrs:activity:id']
                    }
                }
            }
        }
    };
};

/**
 * Export statements by tool
 * @param callback
 */
lrs.byTool = function(callback) {

    var source = lrsdb.statements;
    var destination = db.bytool;
    var tincan = new tincanjs();

    source.find({
        'object.definition.extensions.uoc:lrs:tool:id': { $exists: true }
    }).limit(50000).sort({ _id: -1}).toArray(function(err, docs) {
        if (err) return callback(err);
        destination.remove(function (err, result) {
            if (err) return callback(err);
            docs.forEach(function (statement) {
                var las = tincan.prepareStatement(convertToolStatement(statement));
                destination.insert(las, function (err, result) {
                    if (err) return callback(err);
                });
            });
            return callback();
        });
    });
};

/**
 * Export statements by resource
 * @param callback
 */
lrs.byResource = function(callback) {

    var source = lrsdb.statements;
    var destination = db.byresource;
    var tincan = new tincanjs();

    source.find({
        'object.definition.extensions.uoc:lrs:material:id': { $exists: true }
    }).sort({ _id: -1}).toArray(function(err, docs) {
        if (err) return callback(err);
        destination.remove(function (err, result) {
            if (err) return callback(err);
            docs.forEach(function (statement) {
                var las = tincan.prepareStatement(convertResourceStatement(statement));
                destination.insert(las, function (err, result) {
                    if (err) return callback(err);
                });
            });
            return callback();
        });
    });
};

/**
 * Export statements by classroom
 * @param callback
 */
lrs.byClassroom = function(callback) {

    var source = lrsdb.statements;
    var destination = db.byclassroom;
    var tincan = new tincanjs();

    source.find({
        'object.id': "https://cv.uoc.edu/webapps/aulaca"
    }).limit(50000).sort({ _id: -1}).toArray(function(err, docs) {
        if (err) return callback(err);
        destination.remove(function (err, result) {
            if (err) return callback(err);
            docs.forEach(function (statement) {
                var las = tincan.prepareStatement(convertClassroomStatement(statement));
                destination.insert(las, function (err, result) {
                    if (err) return callback(err);
                });
            });
            return callback();
        });
    });
};

module.exports = lrs;

lrs.byTool(function(err, result) {
    if (err) console.log(err);
    process.exit();
});