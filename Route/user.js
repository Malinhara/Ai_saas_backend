const express = require('express');
const UserService = require('../Services/user');
const chatService = require('../Services/chat')
const Auth = require('../Auth/auth');


const userRouter = express.Router();

userRouter.post('/register', async (req, res) => {
  const response = await UserService.createUser(req.body);
  res.status(response.statusCode).json(response);
});

userRouter.post('/google-register', async (req, res) => {
    const response = await UserService.createGoogleUser(req.body);
    res.status(response.statusCode).json(response);
  });


  userRouter.post('/google-login', async (req, res) => {
    const response = await UserService.googleUserLogin(req.body);
    res.status(response.statusCode).json(response);
  });
  

  

 userRouter.post('/login',async (req, res) => {
    const response = await UserService.userLogin(req.body);
    res.status(response.statusCode).json(response);
  });

  userRouter.post('/send-verification-code',async (req, res) => {

    const response = await UserService.sendcode(req.body);
    res.status(response.statusCode).json(response);
  });


  userRouter.post('/update', async (req, res) => {
    const response = await UserService.userUpdate(req.body);
    res.status(response.statusCode).json(response);
  });



  userRouter.post('/twitter', async (req, res) => {
    const response = await UserService.userTwitter(req.body);
    res.status(response.statusCode).json(response);
  });

  userRouter.post('/twitter/post', async (req, res) => {
    
    const response = await UserService.userTwitterPost(req.body);
    res.status(response.statusCode).json(response);
  });
  

  userRouter.post('/chat/personality', async (req, res) => {
    const response = await chatService.chatPersonality(req.body);
    res.status(response.statusCode).json(response);
  });

  userRouter.post('/chat', async (req, res) => {
    const response = await chatService.chat(req.body);
    res.status(response.statusCode).json(response);
  });


  

  userRouter.get('/verify', Auth.authenticate, (req, res) => {
    res.json({
      success: true,
      message: 'Token is valid',
      userId: req.userId,
      userEmail: req.userEmail
    });
  });

  

//   userRouter.get('/dashboard', Auth.authenticate, async (req, res) => {
//     try {
//       const userRole = req.userRole; 
//       const response = await authorizeAdmin(userRole);
//       res.status(response.statusCode).json(response);
//     } catch (error) {
//       res.status(500).json({ success: false, error: 'Internal server error' });
//     }
//   });
  


module.exports = userRouter;
