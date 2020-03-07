const LocalStrategy = require('passport-local');
const mysql = require("mysql");
const bcrypt = require('bcryptjs');

const conn = require(__dirname+"/model/sqlcon.js");

module.exports = function(passport){
    passport.use(
        new LocalStrategy({usernameField:'email'},(email,password,done)=>{
            //Match user
            //here email and password comes from login page field name
            console.log(email,password);
                q = "select * from employee_data where ID=?";
                conn.query(q,[email],function(err,user,fields){
                //console.log(user[0],email);
                if(err) {return done(err);}
                if(typeof user[0]=='undefined'){
                    return done(null,false,{message:'user id not found'});
                }
                //Match password
                //change this part for hod
                //console.log(user.designation,user.Designation,user.password,user.Password);
                if(user[0].DESIGNATION==='admin' && user[0].ID==email){
                    console.log("you are in admin section...")
                    bcrypt.compare(password,user[0].PASSWORD,function(err,isMatch){
                        if(err) throw err;
                        if(isMatch){
                            return done(null,user[0]);
                        }else{
                            return done(null,false,{message:'password incorrect'});
                        }
                    });
                }else if(user[0].DESIGNATION ==='publisher' && user[0].ID==email){
                    console.log("you are in publisher section...")
                    bcrypt.compare(password,user[0].PASSWORD,function(err,isMatch){
                        if(err) throw err;
                        if(isMatch){
                            return done(null,user[0]);
                        }else{
                            return done(null,false,{message:'password incorrect'});
                        }
                    });
                }else{
                    return done(null,false,{message:'no match'});
                } 
            });
        })
    );
    passport.serializeUser(function(user, done){
        //console.log(user);
        done(null, user.ID);
    });
    passport.deserializeUser(function(id, done){
        //console.log(id);
        conn.query("select * from employee_data where ID=?",[id], function (err, rows){
            //console.log(rows);
            done(err, rows[0]);
            
        });
    });
}