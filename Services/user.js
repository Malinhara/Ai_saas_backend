const User = require('../model/user'); 
const crypto = require('crypto');
const Auth = require('../Auth/auth'); // Adjust the path as necessary
const nodemailer = require('nodemailer');
const config = require('../config'); // Correct for CommonJS
require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const { CronJob } = require('cron');

let tempCodeStorage = {};

const userService = {

  async createUser(userData) {
    const { email, code, password } = userData;
  

    // Check for required fields
    if ( !email || !code || !password ) {
      
      return { success: false, statusCode: 400, error: 'Missing required fields' };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, statusCode: 409, error: 'Email already exists' }; 
    }

    if (tempCodeStorage[code] !== code) {
       
        return { success: false, statusCode: 400, error: 'Invalid or expired verification code' };
      }
    
      // Proceed with user registration and delete the temporary code
   
  
    const { salt, hash } = this.hashPassword(password);
  
    const user = new User({

      email,
      code,
      status:'0',
      password: hash,
      salt
    });

    delete tempCodeStorage[code];
  
    try {
      await user.save();
      return { success: true, statusCode: 201, message: 'User registered successfully!' };
    } catch (error) {
        console.log(error)
      return { success: false, statusCode: 400, error: error.message };
    }
  },



  async createGoogleUser(userData) {
    const { email, code, password } = userData;
  


    // Check for required fields
    if ( !email || !code || !password ) {
      
      return { success: false, statusCode: 400, error: 'Missing required fields' };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { success: false, statusCode: 409, error: 'Email already exists or User Already Sign Up' }; 
    }

    const { salt, hash } = this.hashPassword(password);
  
    const user = new User({

      email,
      code,
      status:'0',
      password: hash,
      salt
    });

    delete tempCodeStorage[code];
  
    try {
      await user.save();
      return { success: true, statusCode: 201, message: 'User registered successfully!' };
    } catch (error) {
        console.log(error)
      return { success: false, statusCode: 400, error: error.message };
    }
  },

  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
  },

  async userLogin(loginData) {
    const { email, password } = loginData;

    if (!email || !password) {
      return { success: false, statusCode: 400, error: 'Email and password are required' };
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, statusCode: 404, error: 'User not found or Not Already Sign Up' }; 
      }

      const isValid = this.validatePassword(password, user.password, user.salt);
      if (!isValid) {
        return { success: false, statusCode: 401, error: 'Invalid password' }; 
      }

      const token = Auth.createToken(user._id, user.email,user.status);

      return { success: true, statusCode: 201, user: { id: user._id, email: user.email,status: user.status }, token }; 
    } catch (error) {
      return { success: false, statusCode: 500, error: 'Internal server error' }; 
    }
  },



  async googleUserLogin(loginData) {

    const { email, password } = loginData;
    
    console.log(email,password)

    if (!email || !password) {
      return { success: false, statusCode: 400, error: 'Email and password are required' };
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, statusCode: 404, error: 'User not found or Not Already Sign Up' }; 
      }

      const isValid = this.validatePassword(password, user.password, user.salt);
      if (!isValid) {
        return { success: false, statusCode: 401, error: 'Invalid password' }; 
      }

      const token = Auth.createToken(user._id, user.email,user.status);

      return { success: true, statusCode: 201, user: { id: user._id, email: user.email,status: user.status}, token }; 
    } catch (error) {
      return { success: false, statusCode: 500, error: 'Internal server error' }; 
    }
  },


  validatePassword(password, hash, salt) {
    if (!hash || !salt) {
      return false; 
    }

    const hashToCompare = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hashToCompare === hash; 
  },

  async sendcode(Data) {

    const { email } = Data;

    if (!email) {
      return { success: false, statusCode: 400, error: 'Email is required' };
    }

    try {
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      tempCodeStorage[code] = code;
    
      // Set up Nodemailer transport
      const transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email provider
        auth: {
          user: config.EMAIL, // Your email address
          pass: config.PASSWORD, // Your email password or app-specific password
        },
      });

   

      // Email content
      const mailOptions = {
        from:config.EMAIL,
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is ${code}`,
      };

      // Send the email
      await transporter.sendMail(mailOptions);


      
      return { success: true, statusCode: 201, message: 'Verification code sent successfully!' };
    } catch (error) {
        console.log(error)
      return { success: false, statusCode: 500, error: error.message };
    }
  },


  async userUpdate(userData) {
    const { email } = userData; // Destructuring user data (status, email)

    // Check if the user exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        // If user exists, update status to 1
        existingUser.status = '1';  // Update the user's status to 1

        try {
            await existingUser.save();  // Save the updated user
            return { success: true, statusCode: 200, message: 'User status updated successfully!' };
        } catch (error) {
            console.error(error);
            return { success: false, statusCode: 400, error: error.message };
        }
    } else {
        return { success: false, statusCode: 404, error: 'User not found' };  // User does not exist
    }
},

  async userTwitter(userData) {
    const { credentials: { appKey, appSecret, accessToken, accessSecret }, email } = userData;


    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        
  
      return { 
        success: false, 
        statusCode: 400, // Bad Request
        message: 'All fields are required.' 
      };
    }

  
    try {
      const existingUser = await User.findOne({ email });
  
      if (existingUser) {
        existingUser.appKey = appKey;
        existingUser.appSecret = appSecret;
        existingUser.accessToken = accessToken;
        existingUser.accessSecret = accessSecret;
  
        await existingUser.save();
  
        return {
          success: true,
          statusCode: 201, // Created
          message: 'Credentials updated successfully!'
        };
      } else {
        return {
          success: false,
          statusCode: 404, // Not Found
          message: 'User not found.'
        };
      }
    } catch (error) {
      console.error(error);
      return {
        success: false,
        statusCode: 500, // Internal Server Error
        message: 'An error occurred while updating user information.',
        error: error.message
      };
    }
  },
  
  
  async scheduleTweet(tweet, scheduleTime, twitterV1Client) {
    // Validate scheduleTime format (e.g., "HH:mm")
    if (!scheduleTime || !scheduleTime.match(/^\d{2}:\d{2}$/)) {
      throw new Error('Invalid schedule format. Expected format: "HH:mm".');
    }
  
    // Convert scheduleTime to cron expression
    const [hour, minute] = scheduleTime.split(':');
    const cronExpression = `${minute} ${hour} * * *`; // Cron format: minute hour * * *
  
    // Create the cron job
    const job = new CronJob(
      cronExpression,
      async () => {
        try {
          const tweetData = await twitterV1Client.tweet(tweet); // Post the tweet
          console.log('Scheduled tweet posted successfully:', tweetData);
        } catch (error) {
          console.error('Error posting scheduled tweet:', error);
        }
      },
      null, // No onComplete function
      true // Start the job immediately
    )
  },
  

  // Main user Twitter post function
  async  userTwitterPost(userData) {
    const { tweet, schedule, email } = userData;
  
    // Validate input
    if (!tweet || !schedule || !email) {
      return { success: false, statusCode: 400, message: 'All fields are required.' };
    }
  
    try {
      // Find the user by email to get their saved Twitter credentials
      const user = await User.findOne({ email });
      if (!user) {
        return { success: false, statusCode: 404, message: 'User not found.' };
      }
  
      // Retrieve Twitter credentials from the user document
      const { accessToken, accessSecret, appKey, appSecret } = user;
      if (!accessToken || !accessSecret || !appKey || !appSecret) {
        return { success: false, statusCode: 500, message: 'Twitter credentials not found for this user.' };
      }
  
      // Set up the Twitter client with the user's credentials
      const twitterClient = new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
      });
  
      const twitterV1Client = twitterClient.readWrite; // Access the v1 API client for posting tweets
  
      if (schedule === 'Just Now') {
        // Post tweet immediately using the v1 API
        try {
          const tweetData = await twitterV1Client.v2.tweet(tweet);
          return {
            success: true,
            statusCode: 201,
            message: 'Tweet posted successfully!',
            tweetData,
          };
        } catch (error) {
          console.error('Error posting tweet:', error);
          return { success: false, statusCode: 500, message: 'Error posting tweet.', error: error.message };
        }
      } else {
        // Handle scheduling the tweet for later
        this.scheduleTweet(tweet, schedule, twitterV1Client);
        return {
          success: true,
          message: `Tweet scheduled for: ${schedule}`,
          statusCode: 201,
          tweetData: { status: tweet, schedule },
        };
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      return {
        success: false,
        statusCode: 500,
        message: 'An error occurred while posting the tweet.',
        error: error.message,
      };
    }
  }

  
  
};

module.exports = userService;




