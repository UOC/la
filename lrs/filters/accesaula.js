var tupla = {};

tupla.transform = function(doc) {

    var id = doc._id['$oid'];
    var user = doc.actor.account.name;
    var semester = doc.timestamp;
    var subject = doc.context.extensions['uoc:lrs:subject:id'];
    var classroom = doc.context.extensions['uoc:lrs:classroom:id'];

    if (doc.object.id == "https://cv.uoc.edu/webapps/aulaca"
        && user
        && semester
        && subject
        && classroom) {
        console.log('ACCESAULA');
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
                        S: 'ACCESAULA'
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