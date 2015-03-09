const TUPLA_ID = 'ACCESACTIVITAT';
const OBJECT_TYPE = 'ACTIVITY';

var tupla = {};

tupla.transform = function(doc) {

    var id = doc._id['$oid'];
    var user = doc.actor.account.name;
    var semester = doc.timestamp;
    var subject = doc.context.extensions['uoc:lrs:subject:id'];
    var classroom = doc.context.extensions['uoc:lrs:classroom:id'];
    var activity = doc.context.extensions['uoc:lrs:activity:id'];
    var type = doc.object.definition ? doc.object.definition.type : false;

    if (type
        && user
        && semester
        && subject
        && classroom
        && activity
        && type == OBJECT_TYPE) {
        console.log(TUPLA_ID);
        console.log(id);
        return {
            PutRequest: {
                Item: {
                    objectId: {
                        S: id
                    },
                    user: {
                        S: user
                    },
                    time: {
                        S: semester
                    },
                    service: {
                        S: TUPLA_ID
                    },
                    resource: {
                        M: {
                            subject: {
                                S: subject
                            }, 
                            classroom: {
                                S: classroom
                            },
                            activity: {
                                S: activity
                            }
                        }
                    },
                    result: {
                        S: "-"
                    }
                }
            }
        }
    }
    
    return false;
}

module.exports = tupla;