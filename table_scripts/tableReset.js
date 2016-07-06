// Import mysql
var mysql = require('mysql');
// Import prompt
var prom = require('prompt');
// Import table creation javascript functions
var tools = require('./tableCreator');

// Belongs at the top of the .js file. Points to the database we will be using
var pool = mysql.createPool({
  host  : '',
  user  : '',
  password: '',
  database: ''
});

// This is the first prompt we will sufrace to the user, asking them to say y/n
var firstAttempt = {
  properties: {
    reset1: {
      description: 'Are you sure you want to reset tables? [Y/N]',
      type: 'string',
      required: true
    }
  }
};

// This function clears all three tables for the project
function clearAllTables() {
  // Drop all tables
  pool.query("DROP TABLE IF EXISTS award", function(err){});
  pool.query("DROP TABLE IF EXISTS user", function(err){});
  // Use function to recreate all of the tables
  createNonExistentTables();
  console.log("Tables cleared succesfully! Exiting.\n");
  // Exit the script
  process.exit(0);
}

// This is the second prompt we will surface to the user, asking them to say y/n
var secondAttempt = {
  properties: {
    reset2: {
      description: 'Are you really really sure? [Y/N]',
      type: 'string',
      required: true
    }
  }
};

// Start up the prompt library
prom.start();

console.log("1\n");
// Start the first prompt for user input
prom.get(firstAttempt, function(err, result) {
  // Convert user input to a single character (looking for y/n)
  console.log("1.5\n");
  var result1 = result.reset1;
  var charOne = result1.substring(0, 1);
  console.log("2\n");
  console.log(charOne + "\n");
  // If character = 'Y' or 'y'
  if (charOne == 'Y' || charOne == 'y') {
    // Make sure they are certain by asking again
    console.log("3\n");
    prom.get(secondAttempt, function(err, result) {
      console.log("4\n");
      var result2 = result.reset2;
      var charTwo = result2.substring(0, 1);
      // If character = 'Y' or 'y' for the second time...
      if (charTwo == 'Y' || charTwo == 'y') {
        console.log("5\n");
        console.log("Clearing tables...\n");
        // Call function to erase and recreate all tables
        clearAllTables();
        console.log("6\n");
      }
    });
  // If user says no, then exit the script
  } else {
    console.log("Good! Probably a wise decision. Exiting");
    // Exit the script
    console.log("7\n");
    process.exit(0);
  }
});
