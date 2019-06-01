'use strict';

const User = require('./users-model.js');

module.exports = (capability) => {
  //Becky via Vinicio - this is going to be curried middleware now
  //Becky a curried function is a function that returns a function
  return (req, res, next) => {

    try {
      console.log('this is req.headers', req.headers);
      let [authType, authString] = req.headers.authorization.split(/\s+/);

      switch (authType.toLowerCase()) {
        case 'basic':
          return _authBasic(authString);
        case 'bearer':
          return _authBearer(authString);
        default:
          return _authError();
      }
    } catch (e) {
      console.log('this is e', e);
      _authError();
    }


    function _authBasic(str) {
    // str: am9objpqb2hubnk=
      let base64Buffer = Buffer.from(str, 'base64'); // <Buffer 01 02 ...>
      let bufferString = base64Buffer.toString();    // john:mysecret
      let [username, password] = bufferString.split(':'); // john='john'; mysecret='mysecret']
      let auth = {username, password}; // { username:'john', password:'mysecret' }

      return User.authenticateBasic(auth)
        .then(user => _authenticate(user))
        .catch(_authError);
    }

    function _authBearer(authString) {
      console.log('this is the auth string', authString);
      return User.authenticateToken(authString)
        .then(user => _authenticate(user))
        .catch(_authError);
    }

    function _authenticate(user) {

      if ( user && (!capability || (user.can(capability))) ) {
        req.user = user;
        req.token = user.generateToken();
        next();
      }
      else {
        _authError();
      }
    }

    function _authError() {
      next('Invalid User ID/Password');
    }

  };
  
};