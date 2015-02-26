var tupla = {};

tupla.transform = function(doc) {

    var id = doc._id['$oid'];
    var user = doc.actor.account.name;
    var semester = doc.timestamp;
    var subject = doc.context.extensions['uoc:lrs:subject:id'];
    var classroom = doc.context.extensions['uoc:lrs:classroom:id'];
    var type = doc.object.definition.type;

    if (user
        && semester
        && subject
        && classroom
        && tool
        && type == 'TEACHING_PLAN') {
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
                        S: 'PLADOCENT'
                    },
                    resource: {
                        S: subject
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