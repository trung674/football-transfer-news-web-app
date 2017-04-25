/*
Credentials for accessing MySql database provided by university.
by Thanh Trung, Omorhefere Imoloame and Mahesha Kulatunga.



*/

// module.exports = {
//   'host'     : 'stusql.dcs.shef.ac.uk',
//   'user'     : 'team087',
//   'password' : 'c827b3fd',
//   'database' : 'team087'
//
// };
var mysql = require('mysql');
var connection = mysql.createConnection({host: 'stusql.dcs.shef.ac.uk', user: 'team087', password: 'c827b3fd', database: 'team087'});//Configure the database

connection.connect(function(err) { //Connect the database.
    if (err) {
        console.log('Error connecting to Db' + err);
        return;
    }
    console.log('Connection established');
    // connection.query("SELECT * FROM db_player_names;", function(error, results, fields) {
    //   console.log(results[0].player_name);
    // });
});

module.exports = connection;
