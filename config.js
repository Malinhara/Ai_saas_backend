require('dotenv').config();

const config = {
  EMAIL: process.env.EMAIL_USER || '', // Default to an empty string if not set
  PASSWORD: process.env.EMAIL_PASS || '', // Default to an empty string if not set
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '', // Default to an empty string if not set
  DDI: process.env.DDI || '', // Default to an empty string if not set

};

// Use CommonJS export
module.exports = config;
