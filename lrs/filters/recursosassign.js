const TUPLA_ID = 'RECURSOSASSIGN';
const OBJECT_TYPE = 'MIFI';

var tupla = {};

tupla.transform = function(doc) {

    var id = doc._id['$oid'];
    var user = doc.actor.account.name;
    var semester = doc.timestamp;
    var subject = doc.context.extensions['uoc:lrs:subject:id'];
    var classroom = doc.context.extensions['uoc:lrs:classroom:id'];
    var type = doc.object.definition ? doc.object.definition.type : false;

    if (type
        && user
        && semester
        && subject
        && classroom
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