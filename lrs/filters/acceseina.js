var tupla = {};

tupla.transform = function(doc) {

    var id = doc._id['$oid'];
    var user = doc.actor.account.name;
    var semester = doc.timestamp;
    var subject = doc.context.extensions['uoc:lrs:subject:id'];
    var classroom = doc.context.extensions['uoc:lrs:classroom:id'];
    var tool = doc.object.definition && doc.object.definition.extensions ? doc.object.definition.extensions['uoc:lrs:tool:id'] : false;
    var type = doc.object.definition ? doc.object.definition.type : false;

    if (type
        && user
        && semester
        && subject
        && classroom
        && tool
        && type != '%{idTipoLink}') {
        console.log('ACCESEINA');
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
                        S: 'ACCESEINA'
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
                        M: {
                            type: {
                                S: type
                            },
                            tool: {
                                S: tool
                            }
                        }
                    }
                }
            }
        }
    }
    
    return false;
}

module.exports = tupla;