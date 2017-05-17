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

var connection = mysql.createConnection({host: 'stusql.dcs.shef.ac.uk', user: 'team087', password: 'c827b3fd', database: 'team087',acquireTimeout: 5000000});//Configure the database


function dbConnect(connection){
  connection.connect(function(err) { //Connect the database.
      if (err) {
          console.log(err.code)
          console.log('Error connecting to Db' + err);
          connection = mysql.createConnection({host: 'stusql.dcs.shef.ac.uk', user: 'team087', password: 'c827b3fd', database: 'team087',acquireTimeout: 5000000});//Configure the database
          dbConnect(connection)

      }
      if(!err){
        console.log('Connection established');
        return connection
      }

      // connection.query("SELECT * FROM db_player_names;", function(error, results, fields) {
      //   console.log(results[0].player_name);
      // });
  });

}
dbConnect(connection)
module.exports = connection;
