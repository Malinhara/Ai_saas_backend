const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  salt: { type: String, required: true },
  code:{type:String,require:false},
  status: { type: String,required: true  },
  appKey: { type: String, required: false },
  appSecret: { type: String, required: false },
  accessToken: { type: String, required: false },
  accessSecret: { type: String, required: false },
  personality:{type:String, require:false}
 
});

const Users = mongoose.model('Users', userSchema);

module.exports = Users;
