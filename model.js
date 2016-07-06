var knex = require('knex')({
	client: 'mysql',
	connection: {
		host: '', 
		user: '', 
		password: '', 
		database: '',
		charset: 'utf8'
	}
});

var bookshelf = require('bookshelf')(knex);

var User = bookshelf.Model.extend({
   tableName: 'user',
   idAttribute: 'id'
});


module.exports = {
   User: User
};
