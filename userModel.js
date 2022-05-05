const mongoose = require("mongoose");

// user schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  // email field
  email: {
    type: String,
    required: [true, "Please provide an Email!"],
    unique: [true, "Email Exist"],
  },
  username: {
    type: String
  },

  //   password field
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    unique: false,
  },
  address: {
    type: String,
    required: [true, "Please provide an address!"],
    unique: false,
  },
  gender: {
    type: String,
  },
  created: {
    type: Date,
    default: Date.now
  },
  textpost: [
    {
      text: String,
      createdat: {
        type: Date,
        default: Date.now
      }
    },
  ],
  post:[{
    img:String,
    generatedcaption1: String,
    generatedcaption2:String,
    usercaption:String,
    finalcaption:{type:String,
      required:true
    },
    location:String,
    likes:Number,
    timestamp:{
      type: Date,
      default: Date.now
    }
  }],
  
  requests:[
    {
      userid:String,
      time:{
        type: Date,
        default: Date.now
      }
    }
  ],
  chat:[
    {
      userid:String,
      message:[{
        content:String,
        time:{
          type: Date,
          default: Date.now
        }
      }]
    }
  ]
  //  cart: [{name: String, price: String}]

});
// export UserSchema
module.exports = mongoose.model.Users || mongoose.model("Users", UserSchema);