var util = require("util");
var consolida = require('./consolida');

var path = require('path');
var args = process.argv.slice(2);
var filename = args[0];

var fs = require('fs')
    , stream = require('stream')
    , es = require("event-stream");

var index = 1;
var bufferSize = 25;
var items = [];

var s = fs.createReadStream(filename)
    .pipe(es.split())
    .pipe(es.mapSync(function(line) {
        s.pause();
        make(line, function(err) {
            s.resume();
        });
    })
    .on('error', function() {
        console.log('Error while reading file.');
    })
    .on('end', function() {
        if (items.length > 0) {
            consolida.update(items, function(err) {
                err && console.log(err);
                console.log(util.format('%d blocks updated', index++));
            });
        }
    })
);

var make = function(line, callback) {
    if (!line) return callback();
    var item = transform(JSON.parse(line));
    items.push(item);
    if (items.length != bufferSize) return callback();
    consolida.update(items, function(err) {
        err && console.log(err);
        console.log(util.format('%d blocks updated', index++));
        items = [];
        return callback();
    });
}

var accesaula = require('./filters/accesaula');
var acceseina = require('./filters/acceseina');

var transform = function(doc) {
    return accesaula.transform(doc)
        || acceseina.transform(doc);
}