var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');
var formidable = require('formidable');
var util = require('util');
var fs = require('fs-extra');
// Need for pdf generation and e-mail
var pdf = require('html-pdf');
var async = require('async');

var Model = require('./model');
//model award
var ModelA = require('./modelA');

var nodemailer = require('nodemailer');

// s3 and AWS required items
var s3 = require('s3');
var aws = require('aws-sdk');
aws.config.region = 'us-west-2';
// Import key for s3
var key1 = fs.readFileSync('key1.txt', 'utf8');
var key2 = fs.readFileSync('key2.txt', 'utf8');
// Configure AWS and s3 instance for use
aws.config.update({accessKeyId:key1, secretAccessKey:key2});
var s3 = new aws.S3({ endpoint: ''}); //ADD ENDPOINT
// PDF creator required items
var pdf = require('html-pdf');

// index
var index = function(req, res, next) {
   if(!req.isAuthenticated()) {
      res.redirect('/signin');
   } else {

      var user = req.user;

      if(user !== undefined) {
         user = user.toJSON();
      }
      if(user.admin == 0){
         var signature_link = "";
         var signature = "";
         new Model.User({email: user.email}).fetch().then(function(model) {
            signature_link = model.get('signature_link');
            console.log(signature_link);
            signature = "" + signature_link;  //ADD LOCATION OF SIGNATURES ON S3
            console.log(signature);
            res.render('index', {title: 'Home', user: user, signature: signature});
         }); 
      }
      else{
         res.redirect('/admin');
      }
   }
};

//award
var award = function(req, res, next){
      var user = req.user;

      if(user !== undefined) {
         user = user.toJSON();
      }
      if(user.admin == 1){
         res.redirect('/admin');
      }
      else{
         //sending awards to the database
         var id = user.id; //get signed in user id
         var award = req.body; //get all info from the form into variable
         var date = new Date(Date.now()); //set date for the current date
         var title = award.title; //get award title
         var name = award.name; //get name of the employee
         var email = award.email; //get the email address
         var output = createFileName(16) + ".pdf"; // Create random generated key for the PDF output
         //create new award object based on the database schema
         var createdAward = new ModelA.Award({user_id: id, award_type: title,
            recipient_email: email, recipient_name: name, award_date: date, pdf_link: output});

         var getUserInfo = new Model.User({'id': id}).fetch().then(function(model) {
           // Need to configure all of the variables used for creating PDF
           var sender = model.get('first_name') + " " + model.get('last_name');
           var receiver = name;
           var image1 = '';
           var image2 = '';
           var image3 = '';
           var signatureName = model.get('signature_link');
           var desc = '';
           var title2 = title + " Award";
           // This modifies the image variables based on the award time being presented
           if (title == "Extra Mile") {
             image1 = 'file://' + __dirname + '/images/mile.jpg';
             image2 = 'file://' + __dirname + '/images/mile-back.jpg';
             desc = "This great honor is bestowed upon individuals that regularly go above and beyond the basic requirements";
           } else {
             image1 = 'file://' + __dirname + '/images/spot.jpg';
             image2 = 'file://' + __dirname + '/images/spot-back.jpg';
             desc = "This award is provided to individuals that displayed ownership while completing an unexpected task";
           }
           var formDate = new Date(date);
           formDate = (formDate.getMonth() + 1) + '/' + formDate.getDate() + '/' + formDate.getFullYear();

           // Using ASYNC to ensure the following procedures happen in a linear fashion
           async.series([ 
             function (callback) { // Download the signature for the PDF
               var bucket = ''; //ADD NAME OF BUCKET
               var path = 'images/' + signatureName;
               getFromS3(s3, bucket, signatureName, path, callback);
             },
             function (callback) { // Generate the certificate
               image3 = 'file://' + __dirname + '/images/' + signatureName;
               createPDF(image1, image2, image3, title2, desc, sender, receiver, formDate, output, callback);
             },
             function (callback) { // E-mail the certificate
               sendEmail(email, model.get('email'), title2, output, callback);
             },
             function (callback) { // Upload the PDF to S3 (and delete from EC2).
               var bucket = '';  //ADD NAME OF BUCKET
               var path = 'images/' + output;
               uploadToS3(s3, bucket, output, path);
               callback();
             },
             function (callback) { // Delete the downloaded signature from EC2
               var filePath = 'images/' + signatureName;
               console.log("THIS IS THE SIG PATH: " + filePath);
               fs.unlinkSync(filePath);
               callback();
             }]);
          });
         createdAward.save().then(res.render('index', {title: 'Home', user: user, message: 'Award was created'}));
      }
};

// profile display page with info
var profile = function(req, res, next) {
   if(!req.isAuthenticated()) {
      res.redirect('/signin');
   } else {

      var user = req.user;

      if(user !== undefined) {
         user = user.toJSON();
      }

      if(user.admin == 1){
         res.redirect('/admin');
      }
      else{
         //console.log(user);
         var userId = user.id;
         var awards = [];
         
         new ModelA.Awards().fetch().then(function(data) {
               data.forEach(function(model){
                  if(model.get('user_id') == userId){
                     //console.log(model.get('award_title').toJSON());
                     awards.push(model.toJSON());
                  }
               })  

            new Model.User({email: user.email}).fetch().then(function(model) {
            signature_link = model.get('signature_link');
            console.log(signature_link);
            signature = "" + signature_link; //ADD NAME OF BUCKET
            console.log(signature);
            res.render('profile', {title: 'Profile', user: user, email: user.email, fname: user.first_name, lname: user.last_name, 
                                                              awards: awards, signature: signature}); 
            }); 
              
         });
      }
   }
};

//profile update information or delete awards
var profilePost = function(req, res, next){
   var user = req.user;
   console.log(user);
   if(user !== undefined) {
      user = user.toJSON();
   }
   
   var newNameF = req.body.fname;
   var newNameL = req.body.lname;

   new Model.User({email: user.email}).fetch().then(function(model) {
      model.save({first_name: newNameF, last_name: newNameL});
   }); 

   res.redirect('/profile');
};

//remove awards
var profileDelete = function(req, res, next){
   var id = req.params.id;
   console.log(id);
   new ModelA.Award({id: id}).destroy();

   res.redirect('/profile');
};


// admin
var admin = function(req, res, next) {
   if(!req.isAuthenticated()) {
      res.redirect('/signin');
   } else {

      var user = req.user;

      if(user !== undefined) {
         user = user.toJSON();
      }
      res.render('admin', {title: 'Home', user: user});
   }
};

// for sending link to email to restore password
//GET
var forgot = function(req, res, next) {
      res.render('forgot', {title: 'Forgot'});
};

//POST
var forgotPost = function(req, res, next) {
   if(req.isAuthenticated()) {
      res.redirect('/');
   } else {

      var email = req.body.email;
      //verify that the user with this email exist
      var usernamePromise = null;
      usernamePromise = new Model.User({email: email}).fetch();
         return usernamePromise.then(function(model) {
         if(!model) {
            res.render('forgot', {title: 'forgot', errorMessage: 'This email does not exist'});
         }
         else{
            //generate token that will be attached to the
            //link sent to email; this token will be send
            //in the db and once the user tries to change the
            //password with the link the token will be verified
            var buf = new Buffer(16);
            for (var i = 0; i < buf.length; i++) {
               buf[i] = Math.floor(Math.random() * 256); //integer between 0 and 255 inclusive
            }
            var token = buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-'); //make it ulr safe without / and +
            var expDate =new Date(Date.now() + 3600000); //1 hour

            model.save({reset_token: token, token_exp_date: expDate});

            //email content
            var text = "To change the password go to the link: " + token + ". This link is valind for 1 hour."; //ADD LINK
            // create reusable transporter object using the default SMTP transport
            var transporter = nodemailer.createTransport({
               service: 'Gmail',
               auth: {
                  user: '', // Your email id
                  pass: '' // Your password
              }
            });

            // setup e-mail data with unicode symbols 
            var mailOptions = {
            from: '<>', // sender address 
            to: email, //receivers
            subject: 'Password Reset', // Subject line 
            text: text
            };
       
            // send mail with defined transport object 
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
            });

                  res.render('forgot', {message: 'Instructions were sent to the email address entered'});
            }
      });
   }
};

//reset password once user follow the link that was received trougth email
//GET
var reset = function(req, res, next) {
   if (req.isAuthenticated()) {
      //user is alreay logged in
      return res.redirect('/');
   }
   var token = req.params.token;

   //verify that there is a user with this token
   var usernamePromise = null;
   usernamePromise = new Model.User({reset_token: token}).fetch();
      return usernamePromise.then(function(model) {
      if(!model) {
         res.render('error', {title: 'Reset', errorMessage: 'This link is not valid'});
      }
      else{
         var expDate = model.get("token_exp_date");
         var curDate = new Date(Date.now());
         //console.log(date);
         //console.log(cur);
         if(expDate < curDate){
               res.render('error', {title: 'Reset', errorMessage: 'This link is expired'});
            }
         //show the UI with new password entry
         res.render('reset', {title: 'Reset', token: token});
      }
   });
};

//POST
var resetPost = function(req, res, next) {
   if (req.isAuthenticated()) {
        //user is alreay logged in
        return res.redirect('/');
   }
   var token = req.params.token;
   //console.log(token);
   //verify that there is a user with this token
   var usernamePromise = null;
   usernamePromise = new Model.User({reset_token: token}).fetch();
      return usernamePromise.then(function(model) {
      if(!model) {
         res.render('error', {title: 'Reset', errorMessage: 'This link is not valid'});
      }
      else{
            var password = req.body.password;
            //console.log(password);
            var hash = bcrypt.hashSync(password);
            model.save({password: hash, reset_token: null, token_exp_date: null});
            res.render('signin', {title: 'Sign In'});
      }
   });
};

// sign in
// GET
var signIn = function(req, res, next) {
	if(req.isAuthenticated()) {
      res.redirect('/');
   }
	res.render('signin', {title: 'Sign In'});
};

// sign in
// POST
var signInPost = function(req, res, next) {
   passport.authenticate('local', { successRedirect: '/',
                          failureRedirect: '/signin'}, function(err, user, info) {
      if(err) {
         return res.render('signin', {title: 'Sign In', errorMessage: err.message});
      } 

      if(!user) {
         console.log(info.message);
         return res.render('signin', {title: 'Sign In', errorMessage: info.message});
      }
      return req.logIn(user, function(err) {
         if(err) {
            return res.render('signin', {title: 'Sign In', errorMessage: err.message});
         } else {
            if(user.admin == false){
               return res.redirect('/');
            }
            else if(user.admin == true){
               return res.redirect('/admin');
            }
         }
      });
   })(req, res, next);
};

// sign up
// GET
var signUp = function(req, res, next) {
   if(req.isAuthenticated()) {
      res.redirect('/');
   } else {
      res.render('signup', {title: 'Sign Up'});
   }
};

// sign up
// POST
var signUpPost = function(req, res, next) {
   var date = new Date(Date.now());
   var usernamePromise = null;

         var form = new formidable.IncomingForm();
         form.parse(req, function(err, fields, files){
            usernamePromise = new Model.User({email: fields.email}).fetch();
            return usernamePromise.then(function(model) {
               if(model) {
                  res.render('signup', {title: 'signup', errorMessage: 'This email already in use'});
               }
               else {
                  var password = fields.password;
                  var hash = bcrypt.hashSync(password);
                  
                  // Convert uploaded file name, to new file name for storage on EC2 and reference in DB
                  var randomName = '';
                  var tempName = files.file.name;
                  
                  // Ensure file exists has an extension
                  if (tempName == '' || tempName.indexOf('.') == -1) {
                     console.log("Oh, it's a blank or non extension file!\n");
                  } else {
                     // Pull off the extension and append to randomly generated number
                     var fileType = tempName.substr(tempName.lastIndexOf('.')+1)
                     randomName = createFileName(16) + '.' + fileType;
                  }
                  
                  var signUpUser = new Model.User({email: fields.email, password: hash, first_name: fields.fname, last_name: fields.lname, 
                                                creation_date: date, signature_link: randomName,
                                                admin: false, active: true});

                  //form.on('end', function(fields, files){
                     console.log(__dirname);
                     //temp location for images
                     var temp_path = form.openedFiles[0].path;
                     //save name of the uploaded file
                     var file_name = form.openedFiles[0].name;
                     //copy files for certain location
                     var new_location = __dirname + '/images/';

                     fs.copy(temp_path, new_location + randomName, function(err){
                        if(err){
                           console.error(err);
                        }
                        else{
                           var bucket = 'recognize.employee.tool/signature';
                           var path = 'images/' + randomName;
                           uploadToS3(s3, bucket, randomName, path);
                           console.log("success!");
                        }
                     });
                  //});
                  
                  signUpUser.save().then(function(model) {
                     return req.logIn(fields, function(err) {
                        if(err) {
                           return res.render('signin', {title: 'Sign In', errorMessage: err.message});
                        } else {
                           return res.redirect('/');
                        }
                     });
                     // sign in the newly registered user
                     //signInPost(req, res, next);
                  });   
                  //res.writeHead(200, {'content-type': 'text/plain'});
                  //res.write('received upload:\n\n');
                  //res.end(util.inspect({fields: fields, files: files}));
               }
            });
   });
};

var adminSignUpUserPost = function(req, res, next) {
   var buttonText = "Continue Adding Users";
   var buttonLink = "/control/add_user";
   var date = new Date(Date.now());
   var usernamePromise = null;

   var form = new formidable.IncomingForm();
   form.parse(req, function(err, fields, files){
      usernamePromise = new Model.User({email: fields.email}).fetch();
      return usernamePromise.then(function(model) {
         if(model) {
            res.render('./pages/control_panel/success', {title: 'User Creation Failed', string: 'The given email address is already in use.',
               buttonLink: buttonLink, buttonText: buttonText});
         } else {
            var password = fields.password;
            var hash = bcrypt.hashSync(password);
            
            // Convert uploaded file name, to new file name for storage on EC2 and reference in DB
            var randomName = '';
            var tempName = files.file.name;
            
            // Ensure file exists has an extension
            if (tempName == '' || tempName.indexOf('.') == -1) {
               console.log("Oh, it's a blank or non extension file!\n");
            } else {
               // Pull off the extension and append to randomly generated number
               var fileType = tempName.substr(tempName.lastIndexOf('.')+1)
               randomName = createFileName(16) + '.' + fileType;
            }
                  
            var signUpUser = new Model.User({email: fields.email, password: hash, first_name: fields.fname, last_name: fields.lname, 
                                             creation_date: date, signature_link: randomName, admin: false, active: true});
            
            //form.on('end', function(fields, files){
            console.log(__dirname);
            //temp location for images
            var temp_path = form.openedFiles[0].path;
            //save name of the uploaded file
            var file_name = form.openedFiles[0].name;
            //copy files for certain location
            var new_location = __dirname + '/images/';

            fs.copy(temp_path, new_location + randomName, function(err){
               if(err){
                  console.error(err);
               } else {
                  var bucket = 'recognize.employee.tool/signature';
                  var path = 'images/' + randomName;
                  uploadToS3(s3, bucket, randomName, path);
                  console.log("success!");
               }
            });

            signUpUser.save().then(function(model){
               res.render('./pages/control_panel/success', 
                  {title: 'User Created Succesfully', string: 'User ' + fields.fname + ' ' + fields.lname + ' has been created.',
                     buttonLink: buttonLink, buttonText: buttonText});
            })
         }
      });
   });
};

// sign up
// GET
var signUpAdmin = function(req, res, next) {
   if(req.isAuthenticated()) {
      res.redirect('/admin');
   } else {
      res.render('signupadmin', {title: 'Sign Up'});
   }
};

// sign up
// POST
var signUpPostAdmin = function(req, res, next) {
   var user = req.body;
   console.log(user.email);
   var date = new Date(Date.now());
   var usernamePromise = null;
   usernamePromise = new Model.User({email: user.email}).fetch();

   return usernamePromise.then(function(model) {
      if(model) {
         res.render('signupadmin', {title: 'signupadmin', errorMessage: 'This email already in use'});
      }
      else if (user.code != 'admin'){
         res.render('signupadmin', {title: 'signupadmin', errorMessage: 'The code entered is invalid'});
      }
      else {
         //****************************************************//
         // MORE VALIDATION GOES HERE(E.G. PASSWORD VALIDATION)
         //****************************************************//
         var password = user.password;
         var hash = bcrypt.hashSync(password);

         var signUpUser = new Model.User({email: user.email, password: hash, creation_date: date,
                                          admin: true, active: true});

         signUpUser.save().then(function(model) {
            console.error(req);
            console.error(res);
            // sign in the newly registered user
            signInPost(req, res, next);
         });   
      }
   });
}

// sign out
var signOut = function(req, res, next) {
   if(!req.isAuthenticated()) {
      notFound404(req, res, next);
   } else {
      req.logout();
      res.redirect('/signin');
   }
};

// BI repots
// GET
var biReports = function(req, res, next) {
   if(!req.isAuthenticated()) {
      res.redirect('/signin');
   }
   else{
      var user = req.user;

      if(user !== undefined) {
         user = user.toJSON();
      }

      var signature_link = "";
         var signature = "";
         new Model.User({email: user.email}).fetch().then(function(model) {
            signature_link = model.get('signature_link');
            console.log(signature_link);
            signature = "" + signature_link; //ADD NAME OF BUCKET
            console.log(signature);
            res.render('bireports', {title: 'BI Reports', signature: signature});
         }); 
   }
    
}

var monthUser = function(req, res){
   res.render('bireports', {title: 'BI Reports'});
};

var typeUser = function(req, res){
   res.render('bireports', {title: 'BI Reports'});
};

var awardsForReports = function(req, res){
   if(!req.isAuthenticated()) {
      res.redirect('/signin');
   } else {
         var awards = [];
         
         new ModelA.Awards().fetch().then(function(data) {
               data.forEach(function(model){
                     awards.push(model.toJSON());
             }); 
               res.setHeader('Content-Type', 'application/json');
               res.send(awards);
         });   

      }
}

// signature
var signatureGet = function(req, res, next) {
   if(!req.isAuthenticated()) {
      res.redirect('/signin');
   } else {

      var user = req.user;

      if(user !== undefined) {
         user = user.toJSON();
      }
      if(user.admin == 0){
         var signature_link = "";
         var signature = "";
         new Model.User({email: user.email}).fetch().then(function(model) {
            signature_link = model.get('signature_link');
            console.log(signature_link);
            signature = "" + signature_link; //ADD NAME OF BUCKET
            console.log(signature);
            res.render('signature', {title: 'Signature', user: user, signature: signature});
         }); 
      }
      else{
         res.redirect('/admin');
      }
   }
};

// index
var signaturePut = function(req, res, next) {
   if(!req.isAuthenticated()) {
      res.redirect('/signin');
   } else {
      var user = req.user;
      if(user !== undefined) {
         user = user.toJSON();
      }
      var signature_link = "";
      new Model.User({email: user.email}).fetch().then(function(model) {
         signature_link = model.get('signature_link');
         console.log(signature_link);
         var form = new formidable.IncomingForm();
         form.parse(req, function(err, fields, files){
            
               // Convert uploaded file name, to new file name for storage on EC2 and reference in DB
               var randomName = signature_link;
               var tempName = files.file.name;
               // Ensure file exists has an extension
               if (tempName == '' || tempName.indexOf('.') == -1) {
                  console.log("Oh, it's a blank or non extension file!\n");
               } 
               
               //temp location for images
               var temp_path = form.openedFiles[0].path;
               //save name of the uploaded file
               var file_name = form.openedFiles[0].name;
               //copy files for certain location
               var new_location = __dirname + '/images/';
               fs.copy(temp_path, new_location + randomName, function(err){
                  if(err){
                     console.error(err);
                  } else {
                     var bucket = 'recognize.employee.tool/signature';
                     var path = 'images/' + randomName;
                     uploadToS3(s3, bucket, randomName, path);
                     console.log("success!");
                  }
               });

            model.save({signature_link: randomName});
            res.render('signature', {title: 'Signature', message: "Signature was changed", signature: "" + randomName}); //ADD NAME OF BUCKET
            
         });
      });
   }
};

var adminEditUserSignature = function(req, res, next) {
   var form = new formidable.IncomingForm();
   var buttonText = "Continue Editing Users";
   var buttonLink = "/control/select_user_edit";

   form.parse(req, function(err, fields, files){
      new Model.User({email: fields.email}).fetch().then(function(model) {
         var signature_link = model.get('signature_link');
         var randomName = signature_link;
         var tempName = files.file.name;

         if(tempName == '' || tempName.indexOf('.') == -1) {
            console.log("Blank or non extension file.\n");
         }

         var temp_path = form.openedFiles[0].path;
         var file_name = form.openedFiles[0].name;
         var new_location = __dirname + '/images/';
         fs.copy(temp_path, new_location + randomName, function(err) {
            if(err) {
               console.error(err);
               res.render('./pages/control_panel/success', {title: 'Signature Change Failed', string: 'Filestream Error: Unable to change the user\'s signature.',
                  buttonLink: buttonLink, buttonText: buttonText});
            } else {
               var bucket = ''; //ADD NAME OF BUCKET
               var path = 'images/' + randomName;
               uploadToS3(s3, bucket, randomName, path);
            }
         });
         model.save({signature_link: randomName});
         res.render('./pages/control_panel/success', {title: 'Signature Changed', string: 'The user\'s signature has been changed.',
            buttonLink: buttonLink, buttonText: buttonText});
      });
   });
};

// 404 not found
var notFound404 = function(req, res, next) {
   res.status(404);
   res.render('404', {title: '404 Not Found'});
};

// export functions
/**************************************/
//BI reports for users
module.exports.monthUser = monthUser;
module.exports.typeUser = typeUser;
module.exports.awardsForReports = awardsForReports;

// index for users main page
module.exports.index = index;

//award creating
module.exports.award = award;
// admin
module.exports.admin = admin;

// profile
// GET
module.exports.profile = profile;

// profile
//UPDATE profile info
module.exports.profilePost = profilePost;

// profile
//DELETE awards
module.exports.profileDelete = profileDelete;

//get link for restiring password
// GET
module.exports.forgot = forgot;
//POST
module.exports.forgotPost = forgotPost;

//reset password
// GET
module.exports.reset = reset;
//POST
module.exports.resetPost = resetPost;

// sigin in
// GET
module.exports.signIn = signIn;
// POST
module.exports.signInPost = signInPost;

// sign up
// GET
module.exports.signUp = signUp;
// POST
module.exports.signUpPost = signUpPost;

// sign up admin
// GET
module.exports.signUpAdmin = signUpAdmin;
// POST
module.exports.signUpPostAdmin = signUpPostAdmin;

// sign out
module.exports.signOut = signOut;

// BI reports
// GET
module.exports.biReports = biReports;

// Signature image
// GET
module.exports.signatureGet = signatureGet;

// Signature image
// PUT
module.exports.signaturePut = signaturePut;

//Admin side user account creation
//Creates user and uploads signature
module.exports.adminSignUpUserPost = adminSignUpUserPost;
module.exports.adminEditUserSignature = adminEditUserSignature;

// 404 not found
module.exports.notFound404 = notFound404;

// This function creates a random ID for the DynamoDB Id field for an instance
function createFileName(length)
{
  // Empty string to hold our id, and the list of possible values
  var text = "";
  var list = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  
  // For loop to create an eight digit string that will be used for our id
  for(var i = 0; i < length; i++) {
    text += list.charAt(Math.floor(Math.random() * list.length));
  }
  return text;
}

// Provide s3object, the bucket to save the file in, the new file name, and the existing file path and file name (with extension if applicable)
function uploadToS3(s3Object, bucket, newName, filePath) {  
  try {
    var body = fs.createReadStream(filePath);
  } 
  catch (err) {
    console.log("Error: File not found");
  }
  var params = {Bucket: bucket, Key: newName, Body: body, ACL: 'public-read'};

  
  s3Object.putObject(params, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log("Succesfully uploaded data to " + bucket);
      // Delete file if succesful
      fs.unlinkSync(filePath);
    }
  });
}

// This function generates the PDF code needed for the award
function createPDF(image1, image2, image3, title, desc, sender, receiver, date, output, callback){
  var html = "<!DOCTYPE html><html lang='en'><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8'><style>body { height: 5in; width: 10.5in; margin-left:auto; margin-right:auto; text-align:center; } #cert_background { position: absolute; left: 0px; top: 0px; z-index: 3; width: 100%; height: 100%; } #cert_text { top: 13%; left: 10%; justify-content: center; position: absolute; z-index: 3; height: 80%; width: 80%; color: rgb(85, 85, 85); } #fit_image { position: absolute; left: 0px; top: 0px; z-index: 1; width: 100%; height:100%; background-position: top left; object-fit: fill; } #alpha_image { position: absolute; left: 0px; top: 0px; z-index: 2; width: 100%; height:100%; opacity: 0.2; background-position: top left; object-fit: fill; } #sig { height: 20%; z-index: 4; } H1 { width: 100%; font-size: 38pt; font-family: Palatino Linotype; text-align: center; border-width: 3px; border-style: double; line-height: 110%; margin-top:0px; margin-bottom; 0px; } H2 { width: 100%; font-size: 16pt; font-family: 'Myriad Pro',Arial,sans-serif; text-align: center; border-width: 0px; border-style: none; line-height: 140%; } H3 { width: 100%; font-size: 12pt; font-family: 'Myriad Pro',Arial,sans-serif; text-align: center; border-width: 0px; border-style: none; line-height: 130%; }strong { text-decoration: underline; }</style><title>Extra Mile Award</title></head><body><div id='cert_background'><img id='fit_image' src='" + image1 + "'><img id='alpha_image' src='" + image2 + "'></div><div id='cert_text'><h1 id='award_name'>" + title + "</h1><h3>" + desc + "</h3><h2><strong>" + receiver + "</strong><br />has been presented this award by<br /><strong>" + sender + "</strong></h2><img id='sig' src='" + image3 + "'><br /><h3><p class='DATETIME'>Date: " + date + "</h3></div></div></body></html>";
  var options = { 'border': '0.5in', 'height': '8in', 'width': '10.5in' };

  pdf.create(html, options).toFile('images/' + output, function(err, res) {
    if (err) {
      console.log(err);
      callback();
      return;
    }
    console.log("THIS IS THE PDF LINK: " + output);
    console.log(res);
    callback();
  });
}

function sendEmail(receiver, sender, award, fileName, callback) {
  //email content
  var body = "CONGRATULATIONS!\n\nYou have received an award! Please see the attached PDF.\n\nSincerely,\nThe Recognize Team";
  // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport({
     service: 'Gmail',
     auth: {
        user: '', // Your email id
        pass: '' // Your password
    }
  });

  // setup e-mail data with unicode symbols 
  var mailOptions = {
    from: '<>', // sender address 
    to: receiver, //receivers
    cc: sender,
    subject: award, // Subject line 
    text: body,
    attachments: [{   
      // stream as an attachment
      filename: award + '.pdf',
      content: fs.createReadStream('images/' + fileName)
    }]
  };

  // send mail with defined transport object 
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          callback();
          return console.log(error);
      }
      callback();
      console.log('Message sent: ' + info.response);
  });
}

// Provide s3Object, bucket the file for retrieval is in, the name of the file you want to retrieve, and the path you want to save it to. 
function getFromS3(s3Object, bucket, fileName, savePathName, callback) {
  var params = { Bucket: bucket, Key: fileName };
  var file = require('fs').createWriteStream(savePathName);
  s3Object.getObject(params).createReadStream().pipe(file);
  callback();
}
/*  */