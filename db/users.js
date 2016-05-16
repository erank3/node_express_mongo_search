var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

_ = require("underscore")

// Connection URL
//var url = 'mongodb://localhost:27017/myproject';
var url = 'mongodb://eran:eraneran123@ds023432.mlab.com:23432/the_league'
var db;
// Use connect method to connect to the Server
var self = this;
MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    self.db = db;
});


exports.addUser = function (userModel, cb) {
    var collection = self.db.collection('users');
    userModel._id = userModel.username;
    collection.insert(userModel, function (err, res) {
            if (err) {
                console.log(err);
            }
            cb(err, res);
        }
    )
};


exports.findByPreferences = function (currentUser, preferences, cb) {

    var users = self.db.collection('users');

    var query = {
        username: {$ne: currentUser.username}
    };

    if (preferences.hairColor) {
        query["preferences.hairColor"] = preferences.hairColor;
    }
    if (preferences.religion) {
        query["preferences.religion"] = preferences.religion;
    }
    if (preferences.minAge) {
        query["preferences.age"] = _.extend({},
            {$gte: preferences.minAge});
    }
    console.log(query["preferences.age"]);
    if (preferences.maxAge) {
        query["preferences.age"] = _.extend(query["preferences.age"]|| {},
            {$lte: preferences.maxAge});
    }

    console.log(query);
    users.find(query,
        function (err, items) {
            if (err) {
                console.log(err);
            }
            cb(err, items)
        });

};

exports.findById = function (id, cb) {
    var users = self.db.collection('users');
    users.findOne({_id: id}, function (err, item) {
        if (err) {
            console.log(err);
        }
        cb(err, item)
    });
};

exports.findByUsername = function (username, cb) {
    var users = self.db.collection('users');
    users.findOne({_id: username}, function (err, item) {
        if (err) {
            console.log(err);
        }
        cb(err, item)
    });
};
