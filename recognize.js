/*
  Module Dependencies
*/

var express = require('express');
var session = require('express-session');
var csv = require('express-csv');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var bcrypt = require('bcrypt-nodejs');
var request = require('request');
var path = require('path');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var fs = require('fs');

/*
  Route Dependencies
*/
var routes = require('./routes');
var control = require('./routes/control');
var reports = require('./routes/reports');

/*
  Configuration
*/

var app = express();

app.set('connection', mysql.createPool({
  host  : '', 
  user  : '',
  password: '',
  database: '',
  multipleStatements: true
}));

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, function(email, password, done) {
   new Model.User({email: email}).fetch().then(function(data) {
      var user = data;
      if(user === null) {
         return done(null, false, {message: 'Invalid email or password'});
      } else {
         user = data.toJSON();
         if(!bcrypt.compareSync(password, user.password)) {
            return done(null, false, {message: 'Invalid email or password'});
         } else {
            return done(null, user);
         }
      }
   });
}));

passport.serializeUser(function(user, done) {
  done(null, user.email);
});

passport.deserializeUser(function(email, done) {
   new Model.User({email: email}).fetch().then(function(user) {
      done(null, user);
   });
});

//Connection test
/*
var client = app.get('connection');

client.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
  if(err)
    console.log(err);
  else
    console.log(rows[0].solution);
});
*/

app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname +  '/public'));
app.set('view engine', 'html');

app.use(cookieParser());
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(session({secret: 'super secret'}));
app.set('port', ); //ADD PORT

app.use(session({ secret: 'secret strategic xxzzz code',
                  resave: true,
                  saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

/*
  Routing
*/
var router = express.Router();

/*
  User Routing
*/
var route = require('./route');
// model user
var Model = require('./model');

// GET main page
app.get('/', route.index);

//POST award
app.post('/award', route.award);

// GET profile page
app.get('/profile', route.profile);

// UPDATE profile page
app.post('/profile', route.profilePost);

// DELETE awards on the profile page
app.post('/profile/:id', route.profileDelete);

// GET page for entering email to get link for password reset
app.get('/forgot', route.forgot);

// POST sends email with link
app.post('/forgot', route.forgotPost);

// GET page for for password reset
app.get('/reset/:token', route.reset);

// PUT resets the password
app.post('/reset/:token', route.resetPost);

// signin
// GET
app.get('/signin', route.signIn);
// POST
app.post('/signin', route.signInPost);

// signup
// GET
app.get('/signup', route.signUp);
// POST
app.post('/signup', route.signUpPost);

// signup admin
// GET
app.get('/signupadmin', route.signUpAdmin);
// POST
app.post('/signupadmin', route.signUpPostAdmin);

// bi reports for user site
// GET
app.get('/bireports', route.biReports);
app.get('/reports/monthUser', route.monthUser);
app.get('/reports/typeUser', route.typeUser);
app.get('/awardsForReports', route.awardsForReports);

// bi reports for user site
// GET
app.get('/signature', route.signatureGet);
app.post('/signature', route.signaturePut);

// logout
// GET
app.get('/signout', route.signOut);

/*
  Admin Routes
*/
router.use(function (req, res, next){
  var user = req.user

  if(user !== undefined) {
    user = user.toJSON();
  }
  if(user === undefined || user.admin == 0){
    res.redirect('/');
  }
  next();
});

router.get('/admin', routes.index);

/*
  Control Panel
*/
router.get('/control', control.index);
router.get('/control/view_users', control.view_users);
router.get('/control/view_awards', control.view_awards);

//Add, edit, remove admins
router.get('/control/add_admin', control.add_admin);
router.post('/control/edit_admin', control.edit_admin);
router.post('/control/remove_admin', control.remove_admin);
router.get('/control/select_admin_edit', control.select_admin_edit);
router.get('/control/select_admin_remove', control.select_admin_remove);
router.post('/control/admin_edited', control.admin_edited);
router.post('/control/admin_created', control.admin_created);

//Add edit, remove users
router.get('/control/add_user', control.add_user);
router.post('/control/adminSignUpUser', route.adminSignUpUserPost);
router.post('/control/adminEditUserSignature', route.adminEditUserSignature);
router.post('/control/edit_user', control.edit_user);
router.post('/control/remove_user', control.remove_user);
router.get('/control/select_user_edit', control.select_user_edit);
router.get('/control/select_user_remove', control.select_user_remove);
router.post('/control/user_edited', control.user_edited);

/*
  Reports
*/
//View BI Graphs
router.get('/reports', reports.index);
router.get('/select', reports.select);

//Download CSV Reports
router.get('/all_users.csv', reports.csv_users);
router.get('/all_awards.csv', reports.csv_all);
router.get('/award_type.csv', reports.csv_type);
router.get('/award_month.csv', reports.csv_month);
router.get('/award_received.csv', reports.csv_received);
router.get('/award_sent.csv', reports.csv_sent);

//Set app to use router
app.use('/', router);

//Error Handling
app.use(function(req,res) {
  res.type('text/html');
  res.status(404);
  res.send('<h1>404 - Not Found</h1>');
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.type('text/html');
  res.status(500);
  res.send('<h1>500 - Server Error</h1>');
});

var server = app.listen(app.get('port'), function(err) {
   if(err) throw err;
   console.log('Server has started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
