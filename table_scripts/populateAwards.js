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

populateAwards();

function populateAwards() {
  //Reset award table
  pool.query("DROP TABLE IF EXISTS award", onDrop);

  function onDrop() {
    var awardTable = "CREATE TABLE IF NOT EXISTS award("+
      "id INT PRIMARY KEY AUTO_INCREMENT,"+
      "user_id INT,"+
      //"FOREIGN KEY (user_id) REFERENCES user(id),"+
      "award_type VARCHAR(255) NOT NULL,"+
      "recipient_email VARCHAR(128) UNIQUE NOT NULL,"+
      "recipient_name VARCHAR(64) NOT NULL,"+
      "pdf_link VARCHAR(64)NOT NULL,"+
      "award_date DATETIME NOT NULL);";

    // Query to create table
    pool.query(awardTable, generateAwards);
  };


  function generateAwards() {
    console.log("generating..");
    var user_id = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var award_type = [
      "On-the-Spot", 
      "Extra Mile", 
      "On-the-Spot", 
      "Extra Mile", 
      "On-the-Spot", 
      "On-the-Spot", 
      "Extra Mile", 
      "On-the-Spot", 
      "Extra Mile", 
      "On-the-Spot", 
      "On-the-Spot"
    ];
    var recipient_email = [
      "cbrown@gmail.com", 
      "sdogg@gmail.com", 
      "rskin@gmail.com", 
      "lfwad@gmail.com", 
      "rgeller@gmail.com", 
      "cbrown@gmail.com", 
      "sdogg@gmail.com", 
      "rskin@gmail.com", 
      "lfwad@gmail.com", 
      "rgeller@gmail.com", 
      "sarcher@gmail.com"
    ];
    var recipient_name = [
      "Charlie Brown", 
      "Snoop Dogg", 
      "Snoop Dogg", 
      "Lord Farkwad", 
      "Snoop Dogg", 
      "Charlie Brown", 
      "Snoop Dogg", 
      "Sterling Archer", 
      "Lord Farkwad", 
      "Ross Geller", 
      "Sterling Archer"
    ];
    var pdf_link = [
      "asdfasdfasdf.png", 
      "qoidnnspci.jpeg", 
      "biaopdp.bmp", 
      "pwndobiendpcqnn.img", 
      "ttttttttttt.raw", 
      "asdfasdfasdf.png", 
      "qoidnnspci.jpeg", 
      "biaopdp.bmp", 
      "pwndobiendpcqnn.img", 
      "ttttttttttt.raw", 
      "merp.gif"
    ];
    var award_date = [
      new Date(2015, 4, 18), 
      new Date(2016, 3, 9), 
      new Date(2015, 8, 22), 
      new Date(2015, 4, 2), 
      new Date(2015, 9, 1), 
      new Date(2015, 7, 18), 
      new Date(2016, 1, 9), 
      new Date(2015, 6, 22), 
      new Date(2015, 9, 2), 
      new Date(2015, 9, 1), 
      new Date(2016, 2, 29)
    ];

    for(var i = 0; i < user_id.length; i++)
    {
      console.log("generating " + i);
      var list = {user_id: user_id[i], award_type: award_type[i], recipient_email: recipient_email[i], recipient_name: recipient_name[i], pdf_link: pdf_link[i], award_date: award_date[i]};
      pool.query('INSERT INTO award set ?', list, function(err, result) {
        if(err)
          console.log(err);
          process.exit(1);
        if(i == user_id.length - 1)
          process.exit(0);
      });
    }
  };
}
