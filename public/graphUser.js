/*
	Constants
*/
var awardsTable;

var backgroundColor = '#F5F5F5';
var width = 550;
var height = 450;

// Root url of website
//var url = "http://localhost:8080";
var url = ""; //HERE GOES URL

function clearDiv() {
	var div = document.getElementById("graph");
	div.innerHTML = "";
}

document.addEventListener('DOMContentLoaded', addClickListeners);


function addClickListeners() {
	google.charts.load('current', {'packages':['corechart']});
	var elements = document.getElementsByClassName('graph_link');
	var req = new XMLHttpRequest();
	var requestString = url + "/awardsForReports";
	req.open("GET", requestString, true);
	req.addEventListener('load', function(){
		if (req.status >= 200 && req.status < 400){
			awardsTable = JSON.parse(req.responseText);

			for (var i = 0; i < elements.length; i++) {
				elements[i].addEventListener('click', function(event) {
					drawChart(event);
					event.preventDefault();
				});
			}
		} else {
			console.log("Error in network request: " + request.statusText);
		}
	});
	req.send(null);
}

function drawChart(event) {
	var options;
	var chart;
	var graphDiv = document.getElementById('graph');
		
	var data = new google.visualization.DataTable();
	/********************************** TYPE **************************/
	if (event.target.id == "type")
	{
		//Collect chart data
		var extraMile = 0;
		var onTheSpot = 0;

		for(var i = 0; i < awardsTable.length; i++){
			if(awardsTable[i].award_type == "Extra Mile"){
				extraMile = extraMile + 1;
			} else {
				onTheSpot = onTheSpot + 1;
			}
		}

		//Define chart
		data.addColumn('string', 'Award');
		data.addColumn('number', 'Number Awarded');
		data.addRows([
			['On-the-Spot', onTheSpot],
			['Extra Mile', extraMile]
		]);

		options = {
			'title':'Awards by Type',
			'width':width,
			'height':height,
			'backgroundColor':backgroundColor
		};

		//Draw chart
		chart = new google.visualization.PieChart(graphDiv);
		chart.draw(data, options);

		while (newContent.firstChild) {
			graphDiv.appendChild(newContent.firstChild);
		}
	}
	/********************************** WEEK **************************/
	else if (event.target.id == "month")
	{
		var onTheSpot = new Array(12);
		var extraMile = new Array(12);
		for(var i = 0; i < onTheSpot.length; i++){
			onTheSpot[i] = 0;
			extraMile[i] = 0;
		}
		var oneYearAgo = new Date();
		oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
		for(var i = 0; i < awardsTable.length; i++){
			var awardDate = new Date(awardsTable[i].award_date)
			if(awardDate > oneYearAgo){
				if(awardsTable[i].award_type == "Extra Mile"){
					//Add to extraMile[awardDate.month]
					extraMile[awardDate.getMonth()]++;
				} else {
					//Add to onTheSpot[awardDate.month]
					onTheSpot[awardDate.getMonth()]++;
				}
			}
		}
		// Create the data table.
		data.addColumn('string', 'Month');
		data.addColumn('number', 'On-the-Spot');
		data.addColumn('number', 'Extra Mile');
		data.addRows([
			['January', onTheSpot[0], extraMile[0]],
			['February', onTheSpot[1], extraMile[1]],
			['March', onTheSpot[2], extraMile[2]],
			['April', onTheSpot[3], extraMile[3]],
			['May', onTheSpot[4], extraMile[4]],
			['June', onTheSpot[5], extraMile[5]],
			['July', onTheSpot[6], extraMile[6]],
			['August', onTheSpot[7], extraMile[7]],
			['September', onTheSpot[8], extraMile[8]],
			['October', onTheSpot[9], extraMile[9]],
			['November', onTheSpot[10], extraMile[10]],
			['December', onTheSpot[11], extraMile[11]]
		]);

		// Set chart options
		options = {
			'title':'Awards by month in the past year',
			'width':700,
			'height':450,
			'vAxis': {minValue: 0},
			'backgroundColor':backgroundColor
		};
		chart = new google.visualization.AreaChart(graphDiv);
		chart.draw(data, options);

		while (newContent.firstChild) {
			graphDiv.appendChild(newContent.firstChild);
		}
	}

}
