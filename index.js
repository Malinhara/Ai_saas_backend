// server.js

const express = require("express");
const dotenv = require("dotenv");
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const userRouter = require("./Route/user");
const connectDB = require('./Dbconnection/dbConnction');
const generateRouter = require("./Route/generate");
// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

connectDB();

// Middleware to serve static files
// Middleware
app.use(cors({
    origin: 'https://ai-saas-frontend.vercel.app',
    credentials: true
  }));
  app.use(express.json());
  app.use(bodyParser.json());
  app.use(helmet()); 
  
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], 
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  }));


app.use('/user', userRouter);
app.use('/generate',generateRouter);
// app.use('/item', itemRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
