const bcrypt = require('bcryptjs');
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fastcsv = require('fast-csv');
const mime = require('mime-types');
const methodOverride = require('method-override');

const {ensureAuthenticated} = require("../authenticate.js");

const app = express();

const router = express.Router();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(methodOverride("_method"));
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,'./public/images');
    },
    filename: function (req, file, cb) {
      cb(null,file.fieldname +'-' + Date.now()+path.extname(file.originalname));
    }
  });
   
var uploads = multer({ storage: storage }).single('fileToUpload');

const conn = require("../model/sqlcon.js");

//admin starts........

router.get("/admin",ensureAuthenticated,function(req,res){
    file = './public/images/download.csv';
    // check if the file exists in the current directory.
    fs.access(file, (err) => {
        if (err) {
            console.log("The file does not exist.");
        } else {
            //delete the saved file.....
            fs.unlinkSync('./public/images/download.csv');
            //console.log("The file exists.");
        }
    });
    res.render("admin");
});

router.get("/admin/registration",ensureAuthenticated,function(req,res){
    res.render("register");
});

router.post("/admin/registration",uploads,function(req,res){
    console.log(req.user.Name);
    console.log(req.file.filename);
    q = "select * from employee_data where ID=?";
    conn.query(q,[req.body.Uid],function(err,results,fields){
        if(!err){
            console.log((typeof results[0]))
            if((typeof results[0])=='undefined'){
                pass=req.body.Password
                if(req.body.Password===req.body.Repassword){
                    bcrypt.genSalt(10,function(err,salt){
                        bcrypt.hash(pass,salt,function(err,hash){
                            if(err) throw err;
                            q = "INSERT INTO employee_data VALUES(?,?,?,?,?,?,?,?)";
                            conn.query(q,[req.body.Uid,req.body.Name,req.body.Email,req.file.filename,req.body.Phone,hash,req.body.designation,req.body.DOB],(err,result)=>{
                                if(!err){
                                    console.log(result);
                                }else{
                                    console.log(err);
                                }
                            })
                        });
                    });
                    req.flash('success_msg','New Librarian successfully registered')
                    res.redirect("/user/admin");
                }else{
                    req.flash('error_msg','Password does not match!!!');
                    res.redirect('/user/admin/registration');
                } 
            }else{
                req.flash('error_msg','User id: '+req.body.Uid+' already exist')
                res.redirect('/user/admin/registration');
            }
        }
    });
});

router.post("/admin/delete",function(req,res){
    let userimg = "";
    q = "select * from employee_data where ID=?";
    conn.query(q,[req.body.userID],function(err,results,fields){
        if(err) throw err;
        if(typeof results[0]==='undefined'){
            req.flash('error_msg','Librarian with id= '+req.body.userID+' does not exist')
            res.redirect('/user/admin');
        }else{
            userimg = results[0].PROFILE;
            console.log(userimg,results[0].PROFILE);
            q="DELETE FROM employee_data WHERE ID=?";
            conn.query(q,[req.body.userID],(err,result)=>{
                if(err) throw err;
                //Delete profile pic.......
                fs.unlinkSync('./public/images/'+userimg);
                req.flash('success_msg','Librarian successfully deleted')
                res.redirect('/user/admin');
            });
        }
    });
});

router.get('/admin/addbook',ensureAuthenticated,(req,res)=>{
    let imgURL = ('/images/'+req.user.PROFILE);
    res.render("addbook",{img:imgURL,name:req.user.NAME});
});

router.post('/admin/addbook',uploads,(req,res)=>{
    
    let stream = fs.createReadStream("./public/images/"+req.file.filename);
    let csvData = [];
    let csvStream = fastcsv
    .parse()
    .on("data", function(data) {
        csvData.push(data);
    })
    .on("end", function() {
        // remove the first line: header
        csvData.shift();

        let query ="INSERT IGNORE INTO library_book (Access_No,Title,Authors,Department) VALUES ?";
        conn.query(query, [csvData], (error, response) => {
          console.log(error || response);
        });
        //delete the saved file.....
        fs.unlinkSync('./public/images/'+req.file.filename);
    });
    stream.pipe(csvStream);
    req.flash('success_msg','Data successfully added to the database');
    res.redirect('/user/admin');
})

router.get('/admin/reset',ensureAuthenticated,(req,res)=>{
    qr="UPDATE library_book SET Matching_Access_No=?,Rack_No=?";
    conn.query(qr,['N/A','N/A'],(er,result)=>{
        if(er) throw er;
        req.flash('success_msg',' Database successfully reset!!');
        res.redirect('/user/admin')
    })
});

router.get("/admin/libDetail",ensureAuthenticated,(req,res)=>{
    const ws = fs.createWriteStream("public/images/download.csv");
    // query data from MySQL
    conn.query("SELECT * FROM library_book", function(error, data, fields) {
        if (error) throw error;

        const jsonData = JSON.parse(JSON.stringify(data));
        //console.log("jsonData", jsonData);

        fastcsv
        .write(jsonData, { headers: true })
        .on("finish", function() {
            console.log("Write to bezkoder_mysql_fastcsv.csv successfully!");
        })
        .pipe(ws);
        
  });
    res.render("libDetail",{filename:"download.csv"});
});

router.get("/admin/download",ensureAuthenticated,(req,res)=>{
    const file = './public/images/download.csv';
    var filename = path.basename(file);
    var mimetype = mime.lookup(file);

    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', mimetype);

    var filestream = fs.createReadStream(file);
    filestream.pipe(res);
  //delete the saved file.....
  fs.unlinkSync('./public/images/download.csv');
});

//admin ends.........

//start of publisher.......

router.get("/publisher",ensureAuthenticated,function(req,res){
    //console.log(req.user); 
    let imgURL = ('/images/'+req.user.PROFILE); 
    res.render("publisher",{img:imgURL,name:req.user.NAME});
});

router.get("/publisher/scan",ensureAuthenticated,(req,res)=>{
    let imgURL = ('/images/'+req.user.PROFILE);
    res.render("scan",{img:imgURL,name:req.user.NAME});
});

router.post("/publisher/scan",(req,res)=>{
    q="select * from library_book where Access_No=?";
    conn.query(q,[req.body.bookID],(err,result,fields)=>{
        if(!err && (typeof result[0]!='undefined')){
            if(result[0].Matching_Access_No==='N/A'){
                qr="UPDATE library_book SET Matching_Access_No=?,Rack_No=? WHERE Access_No=?";
                conn.query(qr,[req.body.bookID,req.body.rackID,req.body.bookID],(error, results, rows, fields)=>{
                    if(error) throw error;
                    req.flash('success_msg','   Book Successfully scanned  !!!');
                    res.status(204).end();
                    //res.redirect("/user/publisher/scan");
                });
            }else{
                req.flash('error_msg','   Book with BookID '+result[0].Access_No+' already available on rack no '+result[0].Rack_No+' !!!');
                res.redirect("/user/publisher/scan");
                //res.status(204).end();
            }
        }else if(!err && (typeof result[0]=='undefined')){
            req.flash('error_msg','   Book with ID '+req.body.bookID+' is not included in database please add before scanning  !!!');
            res.redirect("/user/publisher/scan");
            //res.status(204).end();
        }else{
            req.flash('error_msg','   Something went wrong  !!!');
            res.redirect("/user/publisher/scan");
            //res.status(204).end();
        }
    });
})
//end of publisher..........

router.get("/login",(req,res)=>{
    res.render("login");
});

router.post("/login",(req,res,next)=>{
    q= "select * from employee_data where ID=?";
    conn.query(q,[req.body.email],(er,re,fields)=>{
        //console.log(re[0]);
        if(typeof re[0]!='undefined'){
            if(req.body.designation===re[0].DESIGNATION && req.body.designation==='admin'){
                passport.authenticate('local',{
                    successRedirect:'/user/admin',
                    failureRedirect:'/user/login',
                    failureFlash:true  
                })(req,res,next);
            }else if(req.body.designation===re[0].DESIGNATION && req.body.designation==='publisher'){
                passport.authenticate('local',{
                    successRedirect:'/user/publisher',
                    failureRedirect:'/user/login',
                    failureFlash:true  
                })(req,res,next);
            }else{
                req.flash('error_msg','  There is mismatch in designation please enter correct designation !!')
                res.redirect('/user/login');
            }
        }else{
            req.flash('error_msg','  user id does not exist !!!')
            res.redirect('/user/login');
        }
    })
    
});

router.get('/logout',function(req,res){
    req.logout();
    req.flash('success_msg','you are successfully logged out!');
    res.redirect('/user/login')
});
// var p="S$192118110s"
// router.get("/x",(req,res)=>{
//     //q="select * from employee_data where ID='1CR17CS159'";
//     //conn.query(q,(err,result,fields)=>{
//     //    if(!err){
//             //x="S$192118110s";
//             p="S$192118110s";
//             bcrypt.genSalt(10,function(err,salt){
//                 //const pass=req.body.Repassword;
//                 bcrypt.hash(p,salt,function(err,hash){
//                     if(err) throw err;
//                     //p = hash;
//                     //console.log(p, hash);
//                     q = "INSERT INTO employee_data VALUES('1CR17CS159','SURAJ','sura@gm',?,'publisher','2020-12-12')";
//                     conn.query(q,[hash],(err,result)=>{
//                         if(!err){
//                             console.log(result);
//                         }else{
//                             console.log(err);
//                         }
//                     })
//                 });
//             });
            
//             //console.log(result[0]);
//             //console.log(result[0].EMAIL);
//             res.send("Done!!");
//         });
// //    })
// //})


module.exports = router;