const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const path = require("path");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./public")));
var cookieParser = require("cookie-parser");
app.use(cookieParser());
// app.use(cookieParser());
var multer = require("multer");
app.set("view engine", "ejs");
var mongo = require("mongodb");
var db = require("./db.js");
var fs = require("fs");
const User = require("./userModel");
db();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./auth");
const { spawn } = require("child_process");
const { check, validationResult } = require("express-validator");

//loginpage
app.get("/", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) console.log(err);
      else {
        res.redirect("/home");
      }
    });
  } else {
    res.render("login");
  }
});
app.post("/", (req, res) => {
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
            res.render("login", { message: "password is incorrect" });
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
          res.cookie("id", user._id);
          res.redirect("/home");
        })
        // catch error if password do not match
        .catch((error) => {
          res.render("login", { message: "password is incorrect" });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      res.render("login", { message: "email does not exist" });
    });
});

//signup
app.get("/signup", (req, res) => {
  res.render("signUp");
});

app.post(
  "/signup",
  [
    check("email", "Invalid Email").isEmail(),
    // check('confirmPassword', 'Passwords do not match').custom(( value,{req}) => (req.body.confirmpassword !== req.body.password)),
    check("name", "Name is required").not().isEmpty(),
    check("username", "Username is required").not().isEmpty(),
    check("address", "Address is required").not().isEmpty(),
    check("password", "Password is required").not().isEmpty(),
    check("gender", "gender field required").not().isEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (req.body.password != req.body.confirmpassword) {
      errors.push("Passwords do not match");
    }
    if (!errors.isEmpty()) {
      console.log(req.body.password, req.body.confirmpassword);
      const alert = errors.array();
      res.render("signUp", { alert });
    } else {
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
            gender: req.body.gender,
          });

          // save the new user
          user
            .save()
            // return success if the new user is added to the database successfully
            .then((result) => {
              res.render("login");
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
  }
);

//home
app.get("/home", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        let reqs = [];
        
        if (user.requests.length != 0) {
          var bar = new Promise((resolve, reject) => {
            user.requests.forEach(function (singleUser, index, array) {
              User.find({ _id: singleUser.userid }, function (err, user) {
                if (err) console.log(err);
                else {
                  reqs.push(user[0]);
                  console.log(array.length);
                  if (index === array.length - 1) resolve();
                  return reqs;
                }
              });
            });
          });
          bar.then(() => {
            //  console.log('req',reqs.length);
            res.render("home", { user: user, requests: reqs });
          });
        } else {
          res.render("home", { user: user, requests: [] });
        }
      }
    });
  } else {
    res.render("login");
  }
});
app.post("/addpost", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        var text = req.body.text;
        user.textpost.push({
          text: text,
        });
        res.redirect("/home");

        user.save(function (err) {
          err != null ? console.log(err) : console.log("Data updated");
        });
      }
    });
  }
});
// if (req.cookies.id) {
//     const id = req.cookies.id;
//     User.findOne({ _id: id }, function (err, user) { //find the post base on post name or whatever criteria

//         if (err)
//             console.log(err);
//         else {
//         }
//     });
// }
//findmybuddy
app.get("/findmybuddy", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        res.render("findBuddy", { user: user });
      }
    });
  }
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
//createpost
app.get("/createpost", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        res.render("createPost", { user: user });
      }
    });
  }
});
0;
app.get("/profile", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        res.render("profile", { user: user });
      }
    });
  }
});

// app.post('/createpost',(req,res)=>{
//     console.log(req.body);
// });
app.post("/addimage", upload.single("filename"), (req, res, next) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        // try {
        if (!req.file) {
          console.log("Please select an image file");
        } else {
          const filepath = `public/uploads/${req.file.filename}`;
          console.log(filepath);
          let image = {};
          image["file"] = filepath;
          console.log(image);
          res.cookie("image", image);
          const path = `/uploads/${req.file.filename}`;
          res.render("createPost", { path: path, user: user });
          return;
        }
      }
    });
  }
});

app.post("/generate", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        if (req.cookies.image) {
          cook = req.cookies.image;
          const filepath = req.cookies.image["file"];
          console.log(filepath);
          const python = spawn("python", [
            "caption generation/imagecaption.py",
            filepath,
          ]);
          python.stdout.on("data", function (data) {
            cook["caption"] = data.toString();
            res.cookie("image", cook);
            console.log(data.toString());
            res.render("createPost", {
              path: filepath.slice(7),
              caption: data.toString(),
              user: user,
            });
            return;
          });
        } else {
          console.log("error");
        }
      }
    });
  }
});

app.post("/classify", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        if (req.cookies.image) {
          cook = req.cookies.image;
          const filepath = req.cookies.image["file"];
          console.log(filepath);
          const python = spawn("python", [
            "classification/predict.py",
            filepath,
          ]);
          python.stdout.on("data", function (data) {
            const myArray = data.toString().split("++");
            cook["caption2"] = myArray[1];
            cook["class"] = myArray[0];
            res.cookie("image", cook);
            console.log(myArray[1]);
            res.render("createPost", {
              path: filepath.slice(7),
              captioncrawl: myArray[1],
              classify: myArray[0],
              user: user,
            });
            return;
          });
        } else {
          console.log("error");
        }
      }
    });
  }
});

app.get("/msg", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        console.log(req.query.userid)
        chat=user.chat
        var msg=(chat.find(({ userid }) => userid === req.query.userid ));
        res.render("message",{message:msg,userid:req.query.userid});
          }
        })        
      }
    });


app.post("/sendmessage", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        var oppuser = req.body.userid;
        var text=req.body.text;
        console.log(oppuser,text)
        // user.chat.push({
        //   text: text,
          
        // });
        // user.save(function (err) {
        //   err != null ? console.log(err) : console.log("Data updated");
        // });
        var chat = user.chat;
        console.log(chat);
        res.render("message", { message: chat });
      }
    });
  }
});

app.post("/post", (req, res) => {
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      //find the post base on post name or whatever criteria

      if (err) res.render("login");
      else {
        image = req.cookies.image;
        console.log(image);
        user.post.push({
          img: image["file"],
          generatedcaption: image["caption"],
          crawledcaption: image["caption2"],
          usercaption: image["usercaption"],
          finalcaption: image["caption2"],
          class: image["class"],
          location: image["location"],
        });
        res.clearCookie("image");
        res.redirect("/home");

        user.save(function (err) {
          err != null ? console.log(err) : console.log("data added");
        });
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const delPost = req.body.deletePost;
  User.findOne({ _id: delPost }, function (err, user) {
    if (err) res.render("login");
    else {
      console.log("del");
    }
  });
});

app.get("/req", (req, res) => {
  // console.log(req.params.topic);
  const postId = req.query.accept;
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: id }, function (err, user) {
      if (!err) {
        user.followers.push({
          userid: postId,
        });
        user.save(function (err) {
          err != null ? console.log(err) : console.log("Data updated");
        });
        
        res.redirect("/home");
      }
    });
  }
});

app.post('/cuisine', (req, res) => {
  const cuis = req.body.cuisine;
  // console.log(cuis);
 
    User.find({ cuisine : cuis }, function (err, user) {
      if(!err){
     res.render('findBuddy',{prof:user});
      }
    })
  
  
});
app.get("/follow", (req, res) => {
  // console.log(req.params.topic);
  const postId = req.query.userid;
  if (req.cookies.id) {
    const id = req.cookies.id;
    User.findOne({ _id: postId }, function (err, user) {
      if (!err) {
        user.requests.push({
          userid: id,
        });
        user.save(function (err) {
          err != null ? console.log(err) : console.log("Data updated");
        });
        res.redirect("/home");
      }
    });
  }
});

app.listen(3000, function () {
  console.log("listening on 3000");
});
module.exports = app;
