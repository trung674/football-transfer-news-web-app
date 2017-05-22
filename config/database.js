/**
 * Credentials for accessing MySql database provided by university.
 *
 * @author Thanh Trung, Omorhefere Imoloame and Mahesha Kulatunga
 * @version 1.0.0
 */

var mysql = require('mysql');

var connection = mysql.createConnection({host: 'stusql.dcs.shef.ac.uk', user: 'team087', password: 'c827b3fd', database: 'team087', acquireTimeout: 5000000});//Configure the database

function dbConnect(connection){
  connection.connect(function(err) { //Connect the database.
      if (err) {
          console.log(err.code)
          console.log('Error connecting to Db' + err);
          connection = mysql.createConnection({host: 'stusql.dcs.shef.ac.uk', user: 'team087', password: 'c827b3fd', database: 'team087', acquireTimeout: 5000000});//Configure the database
          dbConnect(connection);
      }

      if(!err) {
          console.log('Connection established');
          return connection;
      }
  });
}

dbConnect(connection)
module.exports = connection;
