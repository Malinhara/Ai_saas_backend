const express = require('express');
const Auth = require('../Auth/auth');
const GenerateService = require('../Services/generate');


const generateRouter = express.Router();

generateRouter.post('/image', async (req, res) => {
  const response = await GenerateService.createImage(req.body);
  console.log(response)
  res.status(response.statusCode).json(response);
});

generateRouter.post('/audio', async (req, res) => {
    const response = await GenerateService.createAudio(req.body);
    res.status(response.statusCode).json(response);
  });

 generateRouter.post('/video', Auth.authenticate, async (req, res) => {
    const response = await GenerateService.createVideo(req.body);
    res.status(response.statusCode).json(response);
  });


  generateRouter.post('/ownvideo', Auth.authenticate, async (req, res) => {
    const response = await GenerateService.createownVideo(req.body);
    res.status(response.statusCode).json(response);
  });



  generateRouter.get('/voicelist', async (req, res) => {
    const response = await GenerateService.getVoices(req.body);
    res.status(response.statusCode).json(response);
  });


  generateRouter.get('/hqpresenters', async (req, res) => {
    const response = await GenerateService.getPresenters(req.body);
    res.status(response.statusCode).json(response);
  });


  

  generateRouter.post('/hqpresenter', async (req, res) => {
    const response = await GenerateService.getPresenter(req.body);
    res.status(response.statusCode).json(response);
  });


  generateRouter.post('/hqownvideo',Auth.authenticate, async (req, res) => {
    const response = await GenerateService.createHqown(req.body);
    res.status(response.statusCode).json(response);
  });


  generateRouter.post('/hqvideo',Auth.authenticate, async (req, res) => {
    const response = await GenerateService.createHqvideo(req.body);
    res.status(response.statusCode).json(response);
  });





module.exports = generateRouter;
