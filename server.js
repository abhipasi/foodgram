const express = require('express');
const app = express();

const mongoose=require('mongoose');
const session = require('express-session');
var findOrCreate = require('mongoose-findorcreate')

const server='127.0.0.1:27017';
const db='foodogramDB';


// Set EJS as templating engine
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));

//db connection
mongoose.connect(`mongodb://${server}/${db}`,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>{
    console.log('db connected');
}).catch((err)=>{
    console.log(err);
});

//schema
const userSchema=new mongoose.Schema({
    name:{type:String,required:true},
    username:{type:String,required:true,unique:true},
    address:String,
    email:String,
    password:String,
    gender:String,
    created:{type:Date,default: Date.now}
});

//defining model
const User=new mongoose.model('user',userSchema);


app.listen(3000, function() {
    console.log('listening on 3000')
  })





 
//loginpage
app.get('/',(req,res)=>{
    res.render('login');  
})
//signup
app.get('/signup',(req,res)=>{
    res.render('signUp');  
})

app.post('/signup',(req,res)=>{
  const user=new User({
      name:req.body.name,
      username:req.body.username,
      address:req.body.address,
      email:req.body.email,
      password:req.body.password,
      gender:req.body.gender  
})

})

//home
app.get('/home',(req,res)=>{
    res.render('home');  
})
//findmybuddy
app.get('/findmybuddy',(req,res)=>{
    res.render('findBuddy');  
})
//createpost
app.get('/createpost',(req,res)=>{
    res.render('createPost');  
})