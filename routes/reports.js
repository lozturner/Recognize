var csv = require('express-csv');
/*
 * GET report page.
 */

exports.index = function(req, res){
	res.render('../views/pages/reports/index');
};

exports.month = function(req, res){
	res.render('../views/pages/reports/index');
};

exports.type = function(req, res){
	res.render('../views/pages/reports/index');
};

exports.received = function(req, res){
	res.render('../views/pages/reports/index');
};

exports.sent = function(req, res){
	res.render('../views/pages/reports/index');
};

exports.select = function(req, res){
	res.app.get('connection').query("SELECT user_id, award.id AS award_id, award_type, recipient_name, award_date, CONCAT_WS(' ', first_name, last_name) AS sender_name, creation_date FROM award, user WHERE user.id = award.user_id GROUP BY award.id", function(err, rows, fields){
		if(err){
			console.log(err);
			return;
		}
		//console.log(rows);
		var tableInfo = JSON.stringify(rows);
		res.setHeader('Content-Type', 'application/json');
		res.send(tableInfo);
	});
};

exports.csv_users = function(req, res){
	res.app.get('connection').query("SELECT * FROM user", function(err, rows, fields){
		if(err){
			console.log(err);
			return;
		}
		
		var headers = {};
		for(key in rows[0]){
			headers[key] = key;
		}
		rows.unshift(headers);
		res.csv(rows);
	});
}

exports.csv_all = function(req, res){
	res.app.get('connection').query("SELECT user_id, award.id AS award_id, award_type, recipient_name, award_date, CONCAT_WS(' ', first_name, last_name) AS sender_name, creation_date FROM award, user WHERE user.id = award.user_id GROUP BY award.id", function(err, rows, fields){
		if(err){
			console.log(err);
			return;
		}
		
		var headers = {};
		for(key in rows[0]){
			headers[key] = key;
		}
		rows.unshift(headers);
		res.csv(rows);
	});
}

exports.csv_type = function(req, res){
	res.app.get('connection').query("SELECT user_id, award.id AS award_id, award_type, recipient_name, award_date, CONCAT_WS(' ', first_name, last_name) AS sender_name, creation_date FROM award, user WHERE user.id = award.user_id GROUP BY award.id", function(err, rows, fields){
		if(err){
			console.log(err);
			return;
		}

		var extraMile = 0;
		var onTheSpot = 0;

		for(var i = 0; i < rows.length; i++){
			if(rows[i].award_type == "Extra Mile"){
				extraMile = extraMile + 1;
			} else {
				onTheSpot = onTheSpot + 1;
			}
		}
		
		var csvRows = [];
		var thisRow = { award_type: "award_type", number_awarded: "number_awarded" };
		csvRows.push(thisRow);
		thisRow = { award_type: "Extra Mile", number_awarded: extraMile };
		csvRows.push(thisRow);
		thisRow = { award_type: "On-the-Spot", number_awarded: onTheSpot };
		csvRows.push(thisRow);

		res.csv(csvRows);
	});
}

exports.csv_month = function(req, res){
	res.app.get('connection').query("SELECT user_id, award.id AS award_id, award_type, recipient_name, award_date, CONCAT_WS(' ', first_name, last_name) AS sender_name, creation_date FROM award, user WHERE user.id = award.user_id GROUP BY award.id", function(err, rows, fields){
		if(err){
			console.log(err);
			return;
		}

		var onTheSpot = new Array(12);
		var extraMile = new Array(12);
		for(var i = 0; i < onTheSpot.length; i++){
			onTheSpot[i] = 0;
			extraMile[i] = 0;
		}
		
		var oneYearAgo = new Date();
		oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
		for(var i = 0; i < rows.length; i++){
			var awardDate = new Date(rows[i].award_date)
			if(awardDate > oneYearAgo){
				if(rows[i].award_type == "Extra Mile"){
					extraMile[awardDate.getMonth()]++;
				} else {
					onTheSpot[awardDate.getMonth()]++;
				}
			}
		}

		var csvRows = [];
		var headerRow = { month: "month", on_the_spot: "On-the-Spot", extra_mile: "Extra Mile" };
		csvRows.push(headerRow);

		var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

		for(var i = 0; i < onTheSpot.length; i++){
			var thisRow = { month: months[i], on_the_spot: onTheSpot[i], extra_mile: extraMile[i] };
			csvRows.push(thisRow);
		}

		res.csv(csvRows);
	});
}

exports.csv_received = function(req, res){
	res.app.get('connection').query("SELECT user_id, award.id AS award_id, award_type, recipient_name, award_date, CONCAT_WS(' ', first_name, last_name) AS sender_name, creation_date FROM award, user WHERE user.id = award.user_id GROUP BY award.id", function(err, rows, fields){
		if(err){
			console.log(err);
			return;
		}

		var receivedData = [];
		for(var i = 0; i < rows.length; i++){
			var name = rows[i].recipient_name;
			if(!receivedData[name]){
				receivedData[name] = 1;
			} else {
				receivedData[name]++;
			}
		}

		var csvRows = [];
		var headerRow = { user: "username", awards_received: "awards_received" };
		csvRows.push(headerRow);

		for(key in receivedData){
			var thisRow = { user: key, awards_received: receivedData[key] };
			csvRows.push(thisRow);
		}

		res.csv(csvRows);
	});
}

exports.csv_sent = function(req, res){
	res.app.get('connection').query("SELECT user_id, award.id AS award_id, award_type, recipient_name, award_date, CONCAT_WS(' ', first_name, last_name) AS sender_name, creation_date FROM award, user WHERE user.id = award.user_id GROUP BY award.id", function(err, rows, fields){
		if(err){
			console.log(err);
			return;
		}

		var sentData = [];
		for(var i = 0; i < rows.length; i++){
			var name = rows[i].sender_name;
			if(!sentData[name]){
				sentData[name] = 1;
			} else {
				sentData[name]++;
			}
		}

		var csvRows = [];
		var headerRow = { user: "username", awards_given: "awards_given" };
		csvRows.push(headerRow);

		for(key in sentData){
			var thisRow = { user: key, awards_received: sentData[key] };
			csvRows.push(thisRow);
		}

		res.csv(csvRows);
	});
}