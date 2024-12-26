require('dotenv').config();

const config = {

  GPT_KEY: process.env.GPT_API_KEY || '' 


};

// Use CommonJS export
module.exports = config;
