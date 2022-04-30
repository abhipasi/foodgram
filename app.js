const express = require("express");
const { NotFoundError, ClientError } = require("./Error");
var multer  = require('multer')
const { spawn } = require('child_process')
const app = express();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage })

app.use(express.urlencoded({ extended: true }));
app.get('/',function(req,res){
    res.sendFile(__dirname + '/views/homepage.html')
  });
app.post("/", upload.single("image"), (req, res, next) => {
    console.log(JSON.stringify(req.file))
    try {
        if (!req.file) {
            throw new ClientError("Please select an image file");
        }
        const filepath = `uploads/${req.body.filename}`;
        console.log(filepath);
        const python = spawn('python',['imagecaption.py',filepath]) 
        python.stdout.on('data', function (data) {
            res.send(data.toString());
         })

     

        // Recommendations goes here!!

    
    } catch (err) {
        next(err);
    }
});

app.all("*", (req, res, next) => {
    return next(new NotFoundError("This page does not exists!!!"));
});

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "Fail";
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
});

module.exports = app;