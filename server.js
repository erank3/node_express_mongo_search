var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');


// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
    function (username, password, cb) {
        db.users.findByUsername(username, function (err, user) {
            if (err) {
                return cb(err);
            }
            if (!user) {
                return cb(null, false);
            }
            if (user.password != password) {
                return cb(null, false);
            }
            return cb(null, user);
        });
    }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function (user, cb) {
    cb(null, user._id);
});

passport.deserializeUser(function (id, cb) {
    db.users.findById(id, function (err, user) {
        if (err) {
            return cb(err);
        }
        cb(null, user);
    });
});


// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
    function (req, res) {
        res.render('home', { user: req.user });
    });

app.get('/signup',
    function (req, res) {
        res.render('signup');
    });

app.post('/signup',
    function (req, res) {
        var userModel = {
            username: req.param("username"),
            password: req.param("password"),
            name: req.param("name"),
            preferences: {
                age: parseInt(req.param("age")),
                hairColor: req.param("hairColor"),
                religion: req.param("religion")
            }
        };
        db.users.addUser(userModel, function (err, dbResult) {
            if (err) {
                console.log(err);
                res.send(err);
                //res.redirect('/');
            } else {
                res.redirect('/login');
            }
        });
    });

app.get('/login',
    function (req, res) {
        res.render('login');
    });

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
    });

app.get('/logout',
    function (req, res) {
        req.logout();
        res.redirect('/');
    });

app.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.render('profile', { user: req.user });
    });


app.get('/candidates',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {

        var preferences = {
            minAge: parseInt(req.param("minAge")) || null,
            maxAge: parseInt(req.param("maxAge")) || null,
            hairColor: req.param("hairColor"),
            religion: req.param("religion")
        };

        db.users.findByPreferences(req.user, preferences, function(err, cursor) {
            if(err) {
                res.send(err);
            }

            cursor.toArray(function(err, items) {
                    res.send(items);
                }
            );
        });

    });


app.listen(3000);
