const express = require('express');
const bodyParser = require('body-parser');
const {check, validationResult} = require('express-validator');
const app = express();
var cookieParser = require('cookie-parser')
app.use(cookieParser())


const mongoose=require('mongoose');
const session = require('express-session');
var findOrCreate = require('mongoose-findorcreate');
const { name } = require('ejs');

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
app.post('/',(req,res)=>{

    const email=req.body.email;
    const password=req.body.password;

    User.find({email:email}).then(users=>{
            // console.log(users);
            if(users.length===0){
                res.render('login',{message:'email does not exist'});
            }else{
                if(users[0].password===password){
                    res.render('home',{user:users[0]});
                }else{
                    res.render('login',{message:'password is incorrect'});
                }
            }
        }).catch(err=>{
            console.log(err);
        });  
})
//signup
app.get('/signup',(req,res)=>{
    res.render('signUp');  
})

app.post('/signup',[
    
    check('email','Invalid Email').isEmail(),
    check('confirmPassword', 'Passwords do not match').custom(( value,{req}) => (req.body.confirmpassword !== req.body.password)),
    check('name','Name is required').not().isEmpty(),
    check('username','Username is required').not().isEmpty(),
    check('address','Address is required').not().isEmpty(),
    check('password','Password is required').not().isEmpty(),
    check('gender','gender field required').not().isEmpty()

],(req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        const alert=errors.array();
        res.render('signUp',{alert});
    }
    else{
        const user=new User({
            name:req.body.name,
            username:req.body.username,
            address:req.body.address,
            email:req.body.email,
            password:req.body.password,
            gender:req.body.gender  
      })
      
      user.save(function(err){
                  if(err){
                      console.log(err);
                  }else{
                      res.render('home');
                  }
              })
      
    }




});

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