// Import mysql
var mysql = require('mysql');

// Belongs at the top of the .js file. Points to the database we will be using
var pool = mysql.createPool({
  host  : '',
  user  : '',
  password: '',
  database: '',
  multipleStatements: true
});

// Create tables on app startup if they don't already exist
createNonExistentTables();

// Create tables on app startup if they don't already exist
function createNonExistentTables() {
  // user table
  var userTable = "CREATE TABLE IF NOT EXISTS user("+
    "id INT PRIMARY KEY AUTO_INCREMENT,"+
    "first_name VARCHAR(64),"+
    "last_name VARCHAR(64),"+
    "email VARCHAR(128) UNIQUE NOT NULL,"+
    "password VARCHAR(128) NOT NULL,"+
    "creation_date DATETIME NOT NULL,"+
    "signature_link VARCHAR(64),"+
    "admin BOOLEAN,"+
    "active BOOLEAN,"+
    "reset_token VARCHAR(128),"+
    "token_exp_date DATETIME);";
  // award table
  var awardTable = "CREATE TABLE IF NOT EXISTS award("+
    "id INT PRIMARY KEY AUTO_INCREMENT,"+
    "user_id INT,"+
    "FOREIGN KEY (user_id) REFERENCES user(id),"+
    "award_type VARCHAR(255) NOT NULL,"+
    "recipient_email VARCHAR(128) UNIQUE NOT NULL,"+
    "recipient_name VARCHAR(64) NOT NULL,"+
    "pdf_link VARCHAR(64)NOT NULL,"+
    "award_date DATETIME NOT NULL);";
  // Query to create all tables at once
  pool.query(userTable + awardTable, function(err){ 
    process.exit(0);
  });
}
