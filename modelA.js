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

var Award = bookshelf.Model.extend({
   tableName: 'award',
   idAttribute: 'id'
});

var Awards = bookshelf.Collection.extend({
    model: Award
});

module.exports = {
   Award: Award,
   Awards: Awards
};