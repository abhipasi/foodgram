const express=require("express");
const app=express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const path = require("path");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,'./public')));
var cookieParser = require('cookie-parser');
app.use(cookieParser());
// app.use(cookieParser());

app.set("view engine", "ejs");
var mongo = require('mongodb');
var db= require('./db.js');
const User = require("./userModel");
db();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./auth");
const req = require("express/lib/request");

app.get("/", (request, response, next) => {
  response.sendFile(path.join(__dirname,'./public/register.html'));
});

// register endpoint
app.get('/register',(req,res) => {
    res.sendFile(path.join(__dirname,'./public/register.html'));
});
app.post("/register", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.regpassword, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: request.body.regemail,
        password: hashedPassword,
        phone:request.body.phone,
        address:request.body.address
      });

      // save the new user
      user
        .save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            message: "User Created Successfully",
            result,
          });
        })
        // catch erroe if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((e) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});
app.get('/login',(req,res) => {
    res.sendFile(path.join(__dirname,'./public/login.html'));
});

// login endpoint
app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email })

    // if email exists
    .then((user) => {
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)

        // if the passwords match
        .then((passwordCheck) => {

          // check if password matches
          if(!passwordCheck) {
            return response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          //   create JWT token
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );

          //   return success response
          response.cookie("id",user._id)
          response.sendFile(path.join(__dirname,'./public/index.html'));
        })
        // catch error if password do not match
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});
app.get("/home", (request, response) => {
  if(request.cookies.id){
    response.sendFile(path.join(__dirname,'./public/index.html'));
  }
  else{
    response.sendFile(path.join(__dirname,'./public/login.html'));
  }
});
app.post("/home", (request, response) => {
  const id =request.cookies.id;
  User.findOne({ _id: id}, function (err, doc) { //find the post base on post name or whatever criteria

    if (err)
      console.log(err);
    else {
            // if found, convert the post into an object, delete the _id field, and add new comment to this post
        var obj = doc.toObject();
        delete obj._id;
  
        obj.cart.push(request.body); // push new comment to comments array
  
        User.update(
           {
             '_id': doc._id
           }, obj, {upsert: true}, function (err) { // upsert: true
               if (err)
                  console.log(err);
           });
      }
      console.log('Done');
    });
  
});
app.get('/cart',(req,res) =>{
  if(req.cookies.id){
    res.render('cart');
   
    }
  else{
  res.sendFile(path.join(__dirname,'./public/login.html'));
  }
});


app.post('/viewcart',(req,res)=>{
  
 const id=req.cookies.id;
  User.findOne({ _id: id}, function (err, result) { //find the post base on post name or whatever criteria

    if (err)
      console.log(err);
    else {
      res.render('cart',{ details:result.cart });
    }
});
});


app.listen(3000, () => {
    console.log(`Server running on port 3000`);
});
module.exports = app;