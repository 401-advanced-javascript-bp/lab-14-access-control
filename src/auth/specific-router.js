'use strict';

const express = require('express');
const specificAuthRouter = express.Router();

const User = require('./users-model.js');
const auth = require('./middleware.js');
const oauth = require('./oauth/google.js');

//Becky - router.get('/public-stuff') should be visible by anyone
specificAuthRouter.get('/public-stuff', (req, res, next) => {
    // res.status(200).send(token)
    res.status(200).send('hello')
    //Becky - next would point back to either middleware or an error. We know that this is not an error for a couple reasons. 
    //One reason is the 200 status. Because it is not an error, you look at the middleware, in this case authRouter
    //which is defined in the app.js file. Its basically pointing to all of the content in this file. Think of it as
    //being read from the top down, starting with line 24 in the app.js file. All of the routing code is compiled here. It then reads 
    //the next app.use lines of code from the top down. (Which is why the Error Handler is listed last.) None of those lines of 
    //code apply to this route, so this function closes out or has ended.
    .catch(next);
  });

  //router.get('/hidden-stuff') should require only a valid login
  //verify
  specificAuthRouter.get('/hidden-stuff', auth(), (req, res, next) => {
    oauth.authorize(req)
    .then( token => {
      res.status(200).send(token);
    })
    .catch(next);
  });

// router.get('/something-to-read') should require the read capability
  specificAuthRouter.get('/something-to-read', auth('read'), (req, res, next) => {
    res.status(200).send('hello, this is read capability')
    .catch(next);
  })

// router.post('/create-a-thing) should require the create capability
// unsure
  specificAuthRouter.post('/create-a-thing', auth('create'), (req, res, next) => {
    let key = req.user.generateKey();
    res.status(200).send(key);
  });

// router.put('/update) should require the update capability
  specificAuthRouter.put('/update', auth('update'), (req, res, next) => {
    res.status(200).send('What is JP? Are you being meta?');
  })

// router.patch('/jp) should require the update capability
//returns a type of user, even though I entered a role of editor
  specificAuthRouter.patch('/jp', auth('update'), (req, res, next) => {
    res.status(200).send('What is JP? Are you being meta?');
  });

// router.delete('/bye-bye) should require the delete capability
//unsure
  specificAuthRouter.delete('/bye-bye', auth('delete'), (req, res, next) => {
      res.status(200).send('you dont want that anyway');
  });

// router.get('/everything') should require the superuser capability
//unsure
//   specificAuthRouter.get('/everything', auth(capabilities.admin), (req, res, next) => {
//     res.status(200).send('youre a super user');
//   });

  module.exports = specificAuthRouter;
