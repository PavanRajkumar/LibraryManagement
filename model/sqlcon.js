const mysql = require("mysql");
const mysqlConnection = mysql.createConnection({
    host:"localhost",
    user:"admin",
    password:"S$192118110s",
    database:"Employee",
    multipleStatements:true
});

mysqlConnection.connect((err)=>{
    if(!err){
        console.log("connection successful!!!");
    }else{
        console.log("connection failed");
    }
});

module.exports = mysqlConnection