var titulacions = require("./titulacions");
var util = require("util");

titulacions.notes(function(err, collection) {
    if (err) console.log(err);
    collection.count({}, function(err, count) {
        if (err) console.log(err);
        console.log(util.format('%d registers on the new collection', count));
        process.exit();
    });
});