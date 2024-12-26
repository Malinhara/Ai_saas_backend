const User = require('../model/user'); 
const crypto = require('crypto');
const Auth = require('../Auth/auth'); // Adjust the path as necessary
const nodemailer = require('nodemailer');
const config = require('../config'); // Correct for CommonJS
require('dotenv').config();

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
}



  
};

module.exports = userService;




