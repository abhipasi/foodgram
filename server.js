const express = require("express");
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const path = require("path");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './public')));
var cookieParser = require('cookie-parser');
app.use(cookieParser());
// app.use(cookieParser());

app.set("view engine", "ejs");
var mongo = require('mongodb');
var db = require('./db.js');
const User = require("./userModel");
db();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./auth");

const { check, validationResult } = require('express-validator');



//schema
// const userSchema=new mongoose.Schema({
//     name:{type:String,required:true},
//     username:{type:String,required:true,unique:true},
//     address:String,
//     email:String,
//     password:String,
//     gender:String,
//     created:{type:Date,default: Date.now}
// });










//loginpage
app.get('/', (req, res) => {
    if (req.cookies.id) {
        const id = req.cookies.id;
        User.findOne({ _id: id }, function (err, user) { //find the post base on post name or whatever criteria

            if (err)
                console.log(err);
            else {
                res.render('home', { user: user });
            }
        });
    }
    else {
        res.render('login');
    }
});
app.post('/', (req, res) => {
    User.findOne({ email: req.body.email })

        // if email exists
        .then((user) => {
            // compare the password entered and the hashed password found
            bcrypt
                .compare(req.body.password, user.password)

                // if the passwords match
                .then((passwordCheck) => {


                    // check if password matches
                    if (!passwordCheck) {
                        res.render('login', { message: 'password is incorrect' });
                        //     return res.status(400).send({
                        //       message: "Passwords does not match",
                        //       error,
                        // });
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
                    res.cookie("id", user._id)
                    res.render('home', { user: user });
                })
                // catch error if password do not match
                .catch((error) => {
                    res.render('login', { message: 'password is incorrect' });
                });
        })
        // catch error if email does not exist
        .catch((e) => {
            res.render('login', { message: 'email does not exist' });
        });
});


//signup
app.get('/signup', (req, res) => {
    res.render('signUp');
})

app.post('/signup', [

    check('email', 'Invalid Email').isEmail(),
    // check('confirmPassword', 'Passwords do not match').custom(( value,{req}) => (req.body.confirmpassword !== req.body.password)),
    check('name', 'Name is required').not().isEmpty(),
    check('username', 'Username is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
    check('password', 'Password is required').not().isEmpty(),
    check('gender', 'gender field required').not().isEmpty(),
], (req, res) => {

    const errors = validationResult(req);
    if (req.body.password != req.body.confirmpassword) {
        errors.push('Passwords do not match');
    }
    if (!errors.isEmpty()) {
        console.log(req.body.password, req.body.confirmpassword);
        const alert = errors.array();
        res.render('signUp', { alert });
    }
    else {
        bcrypt
            .hash(req.body.password, 10)
            .then((hashedPassword) => {
                // create a new user instance and collect the data
                const user = new User({
                    email: req.body.email,
                    password: hashedPassword,
                    phone: req.body.phone,
                    address: req.body.address,
                    name: req.body.name,
                    username: req.body.username,
                    gender: req.body.gender
                });

                // save the new user
                user
                    .save()
                    // return success if the new user is added to the database successfully
                    .then((result) => {
                        res.render('login');
                    })
                    // catch erroe if the new user wasn't added successfully to the database
                    .catch((error) => {
                        console.log(error);

                        res.status(500).send({
                            message: "Error creating user",
                            error,
                        });
                    });
            })
            // catch error if the password hash isn't successful
            .catch((e) => {
                console.log(e);
                res.status(500).send({
                    message: "Password was not hashed successfully",
                    e,
                });
            });
    }
});


//home
app.get('/home', (req, res) => {
    if (req.cookies.id) {
        const id = request.cookies.id;
        User.findOne({ _id: id }, function (err, user) { //find the post base on post name or whatever criteria

            if (err)
                res.render('login');
            else {
                res.render('home', { user: user });
            }
        });
    }
    else {
        res.render('login');
    }
})
app.post('/addpost', (req, res) => {
    if (req.cookies.id) {
        const id = req.cookies.id;
        User.findOne({ _id: id }, function (err, user) { //find the post base on post name or whatever criteria

            if (err)
                res.render('login');
            else {
                var text = req.body.text;
                user.textpost.push({
                    text: text
                })

                user.save(function (err) {
                    err != null ? console.log(err) : console.log('Data updated')
                })
            }
        });
    }
});
// if (req.cookies.id) {
//     const id = request.cookies.id;
//     User.findOne({ _id: id }, function (err, user) { //find the post base on post name or whatever criteria

//         if (err)
//             console.log(err);
//         else {
//         }
//     });
// }
//findmybuddy
app.get('/findmybuddy', (req, res) => {
    if (req.cookies.id) {
        const id = request.cookies.id;
        User.findOne({ _id: id }, function (err, user) { //find the post base on post name or whatever criteria

            if (err)
                res.render('login');
            else {
                res.render('findBuddy');
            }
        });
    }

});
//createpost
app.get('/createpost', (req, res) => {
    if (req.cookies.id) {
        const id = request.cookies.id;
        User.findOne({ _id: id }, function (err, user) { //find the post base on post name or whatever criteria

            if (err)
                res.render('login');
            else {
                res.render('createPost');
            }
        });
    }

});
app.post('/')
app.listen(3000, function () {
    console.log('listening on 3000')
})
module.exports = app;