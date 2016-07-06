var bcrypt = require('bcrypt-nodejs');

/*
 * GET admin control panel page.
 */

exports.index = function(req, res){
  res.render('../views/pages/control_panel/control');
};

/*
 *	View Pages
 */

//View Users
exports.view_users = function(req, res){
	res.app.get('connection').query( 'SELECT * FROM user', function(err, rows) {
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render('../views/pages/control_panel/view_users', {users: rows});
		}
	});
};

//View Awards
exports.view_awards = function(req, res){
	res.app.get('connection').query( 'SELECT * FROM award', function(err, rows) {
		if(err)
		{
			console.log(err);
		}
		else
		{
			res.render('../views/pages/control_panel/view_awards', {awards: rows});
		}
	});
};

/*
 *	Add, modify, delete admin functions
 */

//Add admin form page
exports.add_admin = function(req, res){
	res.render('../views/pages/control_panel/add_admin', { title: "Create New Admin" });
};

//Executes MySQL add code and displays admin creation success
exports.admin_created = function(req, res){
	var buttonText = "Continue Adding Admins";
	var buttonLink = "/control/add_admin";

	var input = req.body.user;
	var datetime = new Date();
	var hash = bcrypt.hashSync(input.password);
	var list = {email: input.email, password: hash, creation_date: datetime, signature_link: "", admin: "1", active: "1"};
	//mysql code
	console.log("Request to add admin:" + JSON.stringify(list));
	req.app.get('connection').query('INSERT INTO user set ?', list, function(err) {
		if (err)
		{
			res.render('../views/pages/control_panel/success', { title: "Admin Creation Failed", 
				string: "Admin " + input.email + " could not be created.",
                buttonLink: buttonLink, buttonText: buttonText });
		}
		else
			res.render('../views/pages/control_panel/success', { title: "Admin User Created", 
				string: "Admin " + input.email + " created successfully.",
                buttonLink: buttonLink, buttonText: buttonText });
	});
};

//Admin select pages
exports.select_admin_remove = function(req, res){
	res.app.get('connection').query('SELECT id, admin, email FROM user', function(err, rows) {
		if(err)
		{
			console.log(err);
		}
		else
		{
			//Select user takes an action(remove admin or user) type(boolean corresponding to admin), title, string, and users rows with id, first_name, and last_name
			res.render('../views/pages/control_panel/select_user', {action: "/control/remove_admin",type: "1", title: "Delete Admin", string: "Select admin to be deleted", users: rows});
		}
	});
};

exports.select_admin_edit = function(req, res){
	res.app.get('connection').query('SELECT id, admin, email FROM user', function(err, rows) {
		if(err)
		{
			console.log(err);
		}
		else
		{
			//Select user takes an action(remove admin or user) type(boolean corresponding to admin), title, string, and users rows with id, first_name, and last_name
			res.render('../views/pages/control_panel/select_user', {action: "/control/edit_admin",type: "1", title: "Edit Admin", string: "Select admin to be edited", users: rows});
		}
	});
};

//Edit admin form page
exports.edit_admin = function(req, res){
	var id = req.body.user.id;
	res.app.get('connection').query('SELECT * FROM user WHERE id = ?', id, function(err, results) {
		if(err)
			console.log(err);
		else
		{
			var list = {email: results[0].email, password: results[0].password, id: id};
			res.render('../views/pages/control_panel/edit_admin', { title: "Edit Admin Information", list: list });
		}
	});
};

//Executes MySQL update code and displays admin edit success
exports.admin_edited = function(req, res){
	var list, hash;
	var buttonText = "Continue Editing Admins";
	var buttonLink = "/control/select_admin_edit";
	var input = req.body.user;
	if(input.password != "") {
		hash = bcrypt.hashSync(input.password);
		list = {email: input.email, password: hash};
	} else {
		list = {email: input.email};
	}
	
	//mysql code
	res.app.get('connection').query('UPDATE user SET ? WHERE id = ?', [list, input.id], function(err, results) {
		if(err)
			res.render('../views/pages/control_panel/success', { title: "Error Editing Admin", string: "Query Error: Admin unable to be edited.",
                buttonLink: buttonLink, buttonText: buttonText });
		else
			res.render('../views/pages/control_panel/success', { title: "Admin Edited", string: "Admin edited successfully.",
                buttonLink: buttonLink, buttonText: buttonText });
	});
};

//Executes MySQL delete code and displays admin delete success
exports.remove_admin = function(req, res){
	var buttonText = "Continue Removing Admins";
	var buttonLink = "/control/select_admin_remove";
	//mysql code
	res.app.get('connection').query('DELETE FROM user WHERE id = ?', [req.body.user.id], function(err, results) {
		if(err)
			res.render('../views/pages/control_panel/success', { title: "Error Deleting Admin", string: "Query Error: Admin unable to be removed.",
                buttonLink: buttonLink, buttonText: buttonText });
		else
			res.render('../views/pages/control_panel/success', { title: "Admin Deleted", string: "Admin removed successfully.",
                buttonLink: buttonLink, buttonText: buttonText });
	});
};


/*
 *	Add, modify, delete user functions
 */

//Add user form page
exports.add_user = function(req, res){
	res.render('../views/pages/control_panel/add_user', { title: "Create New User", string: "New User" });
};

//Executes MySQL add code and displays user creation success
//Dead code -- Functionality replaced and expanded in recognize/route.js
/*
exports.user_created = function(req, res){
	var input = req.body.user;
	var datetime = new Date();
	var list = {first_name: input.first_name, last_name: input.last_name, email: input.email, 
		password: input.password, creation_date: datetime, signature_link: "", admin: "0", active: "1"};
	//mysql code
	console.log("Request to add user:" + JSON.stringify(list));
	req.app.get('connection').query('INSERT INTO user set ?', list, function(err) {
		if (err)
		{
			console.log(err);
			res.render('../views/pages/control_panel/success', { title: "User Creation Failed", 
				string: "User " + input.first_name + " " + input.last_name + " could not be created." });
		}
		else
			res.render('../views/pages/control_panel/success', { title: "User Created", 
				string: "User " + input.first_name + " " + input.last_name + " created successfully." });
	});
};
*/

//User select pages
exports.select_user_remove = function(req, res){
	res.app.get('connection').query('SELECT id, admin, first_name, last_name FROM user', function(err, rows) {
		if(err)
		{
			console.log(err);
		}
		else
		{
			//Select user takes an action(remove admin or user) type(boolean corresponding to admin), title, string, and users rows with id, first_name, and last_name
			res.render('../views/pages/control_panel/select_user', {action: "/control/remove_user",type: "0", title: "Delete User", string: "Select user to be deleted", users: rows});
		}
	});
};

exports.select_user_edit = function(req, res){
	res.app.get('connection').query('SELECT id, admin, first_name, last_name FROM user', function(err, rows) {
		if(err)
		{
			console.log(err);
		}
		else
		{
			//Select user takes an action(remove admin or user) type(boolean corresponding to admin), title, string, and users rows with id, first_name, and last_name
			res.render('../views/pages/control_panel/select_user', {action: "/control/edit_user",type: "0", title: "Edit User", string: "Select user to be edited", users: rows});
		}
	});
};

//Edit user form page
exports.edit_user = function(req, res){
	var id = req.body.user.id;
	res.app.get('connection').query('SELECT * FROM user WHERE id = ?', id, function(err, results) {
		if(err)
			console.log(err);
		else
		{
			var list = {first_name: results[0].first_name, last_name: results[0].last_name, email: results[0].email, password: results[0].password, id: id, signature_link: results[0].signature_link};
			res.render('../views/pages/control_panel/edit_user', { title: "Edit User Information", list: list });
		}
	});
};

//Executes MySQL update code and displays user edit success
exports.user_edited = function(req, res){
	var list, hash;
	var buttonLink = "/control/select_user_edit";
	var buttonText = "Continue Editing Users";

	var input = req.body;
	if(input.password != "") {
		hash = bcrypt.hashSync(input.password);
		list = {first_name: input.first_name, last_name: input.last_name, email: input.email, password: hash};
	} else {
		list = {first_name: input.first_name, last_name: input.last_name, email: input.email};
	}

	console.log(input);
	
	//mysql code
	res.app.get('connection').query('UPDATE user SET ? WHERE id = ?', [list, input.id], function(err, results) {
		if(err)
			res.render('../views/pages/control_panel/success', { title: "Error Editing User", string: "Query Error: User unable to be edited.",
                buttonLink: buttonLink, buttonText: buttonText });
		else
		{
			res.render('../views/pages/control_panel/success', { title: "User Edited", string: "User edited successfully.",
                buttonLink: buttonLink, buttonText: buttonText });
			console.log(results);
		}
	});
};

//Executes MySQL delete code and displays user delete success
exports.remove_user = function(req, res){
	var buttonLink = "/control/select_user_remove";
	var buttonText = "Continue Removing Users";
	//mysql code
	res.app.get('connection').query('DELETE FROM user WHERE id = ?', [req.body.user.id], function(err, results) {
		if(err)
			res.render('../views/pages/control_panel/success', { title: "Error Removing User", string: "Query Error: User unable to be removed.",
                buttonLink: buttonLink, buttonText: buttonText });
		else
			res.render('../views/pages/control_panel/success', { title: "User Removed", string: "User removed successfully.",
                buttonLink: buttonLink, buttonText: buttonText });
	});
};
