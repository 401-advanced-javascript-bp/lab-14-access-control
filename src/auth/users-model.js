'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('./roles-model.js');

//Becky - ask
//we want this to be true or false
//if present true, if not present false
const SINGLE_USE_TOKENS = !!process.env.SINGLE_USE_TOKENS;
const TOKEN_EXPIRE = process.env.TOKEN_LIFETIME || '5m';
const SECRET = process.env.SECRET || 'foobar';

const usedTokens = new Set();

const users = new mongoose.Schema({
  username: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  email: {type: String},
  // roles: {type: String, default:'user', enum: ['admin','editor','user']},
  role: { type:String, required: true, ref: 'roles' },
    // editor: { type: mongoose.Schema.Types.ObjectId, ref: 'Editor' },
    // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

//Becky - Are these supposed to be nested? I could try nesting into two more schemas, but am not sure thats accurate

});
const roles = new mongoose.Schema({
  role: {type:String, required: true, enum: ['admin', 'editor', 'user'], ref: 'capabilities' },
});

// const roles = new mongoose.Schema({
//   role: {type:String, required: true, unique:true },
//   capabilities: {type: Array, required:true }
// });

const capabilities = mongoose.Schema ({
  admin: { type:Array, required: true, permissions: ['create','read','update','delete']},
  editor: { type:Array, required: true, permissions: ['create', 'read', 'update'] },
  user:  { type:Array, required: true, permissions: ['read'] }
});

const permissions = mongoose.Schema({

})

users.pre('save', function(next) {
  bcrypt.hash(this.password, 10)
    .then(hashedPassword => {
      this.password = hashedPassword;
      next();
    })
    .catch(error => {throw new Error(error);});
});

users.statics.createFromOauth = function(email) {

  if(! email) { return Promise.reject('Validation Error'); }

  return this.findOne( {email} )
    .then(user => {
      if( !user ) { throw new Error('User Not Found'); }
      return user;
    })
    .catch( error => {
      let username = email;
      let password = 'none';
      return this.create({username, password, email});
    });

};

users.statics.authenticateToken = function(token) {
  
  if ( usedTokens.has(token ) ) {
    return Promise.reject('Invalid Token');
  }
  
  try {
    let parsedToken = jwt.verify(token, SECRET);
    console.log('this is parsedToken', parsedToken);
    (SINGLE_USE_TOKENS) && parsedToken.type !== 'key' && usedTokens.add(token);
    let query = {_id: parsedToken.id};
    return this.findOne(query);
  } catch(e) { throw new Error('Invalid Token'); }
  
};

users.statics.authenticateBasic = function(auth) {
  let query = {username:auth.username};
  return this.findOne(query)
    .then( user => user && user.comparePassword(auth.password) )
    .catch(error => {throw error;});
};

users.methods.comparePassword = function(password) {
  return bcrypt.compare( password, this.password )
    .then( valid => valid ? this : null);
};

users.methods.generateToken = function(type) {
  
  let token = {
    id: this._id,
    capabilities: capabilities[this.role],
    type: type || 'user',
  };
  
  let options = {};
  //Becky - !! makes the second condition truthy. Sometimes the && while not catch that the second condition is true or false. Instead it will reference the value.
  if ( type !== 'key' && !! TOKEN_EXPIRE ) { 
    options = { expiresIn: TOKEN_EXPIRE };
  }
  
  return jwt.sign(token, SECRET, options);
};

users.methods.can = function(capability) {
  return capabilities[this.role].includes(capability);
};

users.methods.generateKey = function() {
  return this.generateToken('key');
};

module.exports = mongoose.model('users', users);
