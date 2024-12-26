const express = require('express');
const openAi = require("openai");
const fs =  require('fs');
const path = require('path');
const app = express();
const config = require('../config'); // Correct for CommonJS
const User = require('../model/user');

// Serve files from the 'Audio' folder
app.use('/audio', express.static(path.join(__dirname, 'Audio'))); // Serve audio files statically from the Audio folder

const speechFile = path.join(__dirname, 'Audio', 'output.mp3'); // Path to save the audio file

app.use(express.json()); // To parse JSON requests
// // Configure OpenAI API
const conn = new openAi.OpenAI({
    apiKey: config.GPT_KEY
  });



const GenerateService = {

  async createImage(userData) {
    const { prompt } = userData;

    if (!prompt) {
      return { success: false, statusCode: 400, error: 'Prompt is required' };
    }


    try {
      // Call the OpenAI API to generate an image
      const response = await conn.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "512x512",
      });

      const imageUrl = response.data[0].url;

      return { success: true, statusCode: 201, data: { imageUrl } };

    } catch (error) {
      return { success: false, statusCode: 500, error: error.message };
    }
  },

  async createAudio(userData) {

    const { text , voice } = userData;


    if (!text || !voice) {
        return { success: false, statusCode: 400, error: 'Field is required' };
      }

    try{

    const mp3 = await conn.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: text,
      });

       // Convert the arrayBuffer to a buffer and save the file
      const buffer = Buffer.from(await mp3.arrayBuffer());
      await fs.promises.writeFile(speechFile, buffer);

          // Return the audio file URL to the frontend
      const audioUrl = `http://localhost:3001/Services/Audio/output.mp3`; // URL to access the audio file (modify as necessary)
      return {statusCode: 201, success: true, audioUrl };

     } 
     catch (error) {

          console.error('Error generating audio:', error.message);
          return { statusCode: 500, success: false, error: error.message };

    }
   
  },


  async createVideo (userData) {
    const { imagelink, voiceid, prompt, email } = userData;
  
    // Validate required parameters
    if (!voiceid || !imagelink || !prompt) {
      return {
        success: false,
        statusCode: 400,
        error: 'Voice ID, image link, and prompt are required.',
      };
    }
  
    const url = 'https://api.d-id.com/talks';
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: config.DDI,
      },
      body: JSON.stringify({
        source_url: imagelink,
        script: {
          type: 'text',
          subtitles: false,
          provider: { type: 'microsoft', voice_id: voiceid },
          input: prompt,
        },
        config: { fluent: false, pad_audio: 0.0 },
      }),
    };
  
    // Handle email logic if provided
    if (email) {
      try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
          return {
            success: false,
            statusCode: 404,
            error: 'User not found for the provided email.',
          };
        }
  
        existingUser.status = '1'; // Update the user's status to '1'
  
        await existingUser.save(); // Save the updated user
      } catch (error) {
        console.error('Error updating user status:', error.message);
        return {
          success: false,
          statusCode: 500,
          error: `Error updating user: ${error.message}`,
        };
      }
    }
  
    // API call to create a video
    try {
      const response = await fetch(url, options);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP Error! Status: ${response.status} - ${errorData.message}`
        );
      }
  
      const data = await response.json();
      return { success: true, statusCode: 201, data };
    } catch (error) {
      console.error('Error creating video:', error.message);
      return {
        success: false,
        statusCode: 500,
        error: `Error creating video: ${error.message}`,
      };
    }
  },


  async createownVideo(userData) {
    const { audiolink, imagelink, email } = userData;
  
    // Validate required parameters
    if (!audiolink || !imagelink) {
      return {
        success: false,
        statusCode: 400,
        error: 'Audio link and image link are required.',
      };
    }
  
    const url = 'https://api.d-id.com/talks';
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: config.DDI,
      },
      body: JSON.stringify({
        source_url: imagelink,
        script: {
          type: 'audio',
          subtitles: false,
          audio_url: audiolink,
        },
        config: { fluent: false, pad_audio: 0.0 },
        face: {size: 150}
      }),
    };
  
    // Handle email logic if provided
    if (email) {
      try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
          return {
            success: false,
            statusCode: 404,
            error: 'User not found for the provided email.',
          };
        }
  
        existingUser.status = '1'; // Update the user's status to '1'
  
        await existingUser.save(); // Save the updated user
      } catch (error) {
        console.error('Error updating user status:', error.message);
        return {
          success: false,
          statusCode: 500,
          error: `Error updating user: ${error.message}`,
        };
      }
    }
  
    // API call to create a video
    try {
      const response = await fetch(url, options);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP Error! Status: ${response.status} - ${errorData.message}`
        );
      }
  
      const data = await response.json();
      return { success: true, statusCode: 201, data };
    } catch (error) {
      console.error('Error creating video:', error.message);
      return {
        success: false,
        statusCode: 500,
        error: `Error creating video: ${error.message}`,
      };
    }
  },
  

    async getVoices() {

    const url = 'https://api.d-id.com/tts/voices?provider=microsoft';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: config.DDI
      }
    };


    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP Error! Status: ${response.status} - ${errorData.message}`);
      }
      const data = await response.json();
      return { success: true, statusCode: 201, data };
    } catch (error) {

      return { success: false, statusCode: 500, error: error.message };
    }
  },


  async getPresenters() {

    const url = 'https://api.d-id.com/clips/presenters';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: config.DDI
      }
    };


    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP Error! Status: ${response.status} - ${errorData.message}`);
      }
      const data = await response.json();
      return { success: true, statusCode: 201, data };
    } catch (error) {

      return { success: false, statusCode: 500, error: error.message };
    }

  },



  async getPresenter(userData) {

    const{id} = userData;
    console.log(id)

    const url = `https://api.d-id.com/clips/presenters/${id}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: config.DDI
      }
    };


    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP Error! Status: ${response.status} - ${errorData.message}`);
      }
      
      const data = await response.json();
      console.log(data)
      return { success: true, statusCode: 201, data };
    } catch (error) {

      return { success: false, statusCode: 500, error: error.message };
    }
  },


  async createHqown (userData) {
    const { presenterid,audiolink, email } = userData;

    console.log(presenterid,audiolink,email)
  
    // Validate required parameters
    if (!audiolink || !presenterid) {
      return {
        success: false,
        statusCode: 400,
        error: 'required fields are empty.',
      };
    }
  
    const url = 'https://api.d-id.com/clips';

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: config.DDI,
      },
      body: JSON.stringify({
        presenter_id: presenterid,
        script: {
          type: 'audio',
          subtitles: 'false',
          audio_url: audiolink,
          ssml: 'false',
        },
        config: {result_format: 'mp4'},
        presenter_config: {crop: {type: 'wide'}}
      })
    };
    // Handle email logic if provided
    if (email) {
      try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
          return {
            success: false,
            statusCode: 404,
            error: 'User not found for the provided email.',
          };
        }
  
        existingUser.status = '1'; // Update the user's status to '1'
  
        await existingUser.save(); // Save the updated user
      } catch (error) {
        console.error('Error updating user status:', error.message);
        return {
          success: false,
          statusCode: 500,
          error: `Error updating user: ${error.message}`,
        };
      }
    }
  
    // API call to create a video
    try {
      const response = await fetch(url, options);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP Error! Status: ${response.status} - ${errorData.message}`
        );
      }
  
      const data = await response.json();
      return { success: true, statusCode: 201, data };
    } catch (error) {
      console.error('Error creating video:', error.message);
      return {
        success: false,
        statusCode: 500,
        error: `Error creating video: ${error.message}`,
      };
    }
  },
  



  async createHqvideo (userData) {
    const { presenterid,prompt, voiceid,email } = userData;

    console.log(presenterid,prompt, voiceid,email)
  
    // Validate required parameters
    if (!prompt || !voiceid|| !presenterid) {
      return {
        success: false,
        statusCode: 400,
        error: 'required.',
      };
    }
  
    const url = 'https://api.d-id.com/clips';

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization:config.DDI,
      },
      body: JSON.stringify({
        presenter_id: presenterid,
        script: {
          type: 'text',
          subtitles: 'false',
          provider: {type: 'microsoft', voice_id: voiceid},
          input: prompt,
          ssml: 'false'
        },
        config: {result_format: 'mp4'},
        presenter_config: {crop: {type: 'wide'}}
      })
    };

    // Handle email logic if provided
    if (email) {
      try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
          return {
            success: false,
            statusCode: 404,
            error: 'User not found for the provided email.',
          };
        }
  
        existingUser.status = '1'; // Update the user's status to '1'
  
        await existingUser.save(); // Save the updated user
      } catch (error) {
        console.error('Error updating user status:', error.message);
        return {
          success: false,
          statusCode: 500,
          error: `Error updating user: ${error.message}`,
        };
      }
    }
  
    // API call to create a video
    try {
      const response = await fetch(url, options);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP Error! Status: ${response.status} - ${errorData.message}`
        );
      }
  
      const data = await response.json();
      return { success: true, statusCode: 201, data };
    } catch (error) {
      console.error('Error creating video:', error.message);
      return {
        success: false,
        statusCode: 500,
        error: `Error creating video: ${error.message}`,
      };
    }
  },

}



  

module.exports = GenerateService;





//  authorization: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik53ek53TmV1R3ptcFZTQjNVZ0J4ZyJ9.eyJodHRwczovL2QtaWQuY29tL2ZlYXR1cmVzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX2N1c3RvbWVyX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJvZHVjdF9uYW1lIjoidHJpYWwiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9zdWJzY3JpcHRpb25faWQiOiIiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9iaWxsaW5nX2ludGVydmFsIjoibW9udGgiLCJodHRwczovL2QtaWQuY29tL3N0cmlwZV9wbGFuX2dyb3VwIjoiZGVpZC10cmlhbCIsImh0dHBzOi8vZC1pZC5jb20vc3RyaXBlX3ByaWNlX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9zdHJpcGVfcHJpY2VfY3JlZGl0cyI6IiIsImh0dHBzOi8vZC1pZC5jb20vY2hhdF9zdHJpcGVfc3Vic2NyaXB0aW9uX2lkIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9jcmVkaXRzIjoiIiwiaHR0cHM6Ly9kLWlkLmNvbS9jaGF0X3N0cmlwZV9wcmljZV9pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vcHJvdmlkZXIiOiJhdXRoMCIsImh0dHBzOi8vZC1pZC5jb20vaXNfbmV3IjpmYWxzZSwiaHR0cHM6Ly9kLWlkLmNvbS9hcGlfa2V5X21vZGlmaWVkX2F0IjoiMjAyNC0xMi0yMVQxMTowNTowNC4wNTdaIiwiaHR0cHM6Ly9kLWlkLmNvbS9vcmdfaWQiOiIiLCJodHRwczovL2QtaWQuY29tL2FwcHNfdmlzaXRlZCI6WyJTdHVkaW8iXSwiaHR0cHM6Ly9kLWlkLmNvbS9jeF9sb2dpY19pZCI6IiIsImh0dHBzOi8vZC1pZC5jb20vY3JlYXRpb25fdGltZXN0YW1wIjoiMjAyNC0xMi0yMVQxMTowMzoxNC43ODFaIiwiaHR0cHM6Ly9kLWlkLmNvbS9hcGlfZ2F0ZXdheV9rZXlfaWQiOiJnbW94c2ZzMjM0IiwiaHR0cHM6Ly9kLWlkLmNvbS91c2FnZV9pZGVudGlmaWVyX2tleSI6Imx6TnRrRTFhNkJiczc0MkhLdlZFRyIsImh0dHBzOi8vZC1pZC5jb20vaGFzaF9rZXkiOiJkMGlHdG9NNmxzVGo3bFpfY0NMckIiLCJodHRwczovL2QtaWQuY29tL3ByaW1hcnkiOnRydWUsImh0dHBzOi8vZC1pZC5jb20vZW1haWwiOiJwb29ybmFtYWxpbmhhcmE1M0BnbWFpbC5jb20iLCJodHRwczovL2QtaWQuY29tL2NvdW50cnlfY29kZSI6IkxLIiwiaHR0cHM6Ly9kLWlkLmNvbS9wYXltZW50X3Byb3ZpZGVyIjoic3RyaXBlIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLmQtaWQuY29tLyIsInN1YiI6ImF1dGgwfDY3NjZhMDcyY2JkZTllMTJkZTJmZjMxMiIsImF1ZCI6WyJodHRwczovL2QtaWQudXMuYXV0aDAuY29tL2FwaS92Mi8iLCJodHRwczovL2QtaWQudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTczNDc3OTMzMCwiZXhwIjoxNzM0ODY1NzMwLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIHJlYWQ6Y3VycmVudF91c2VyIHVwZGF0ZTpjdXJyZW50X3VzZXJfbWV0YWRhdGEgb2ZmbGluZV9hY2Nlc3MiLCJhenAiOiJHenJOSTFPcmU5Rk0zRWVEUmYzbTN6M1RTdzBKbFJZcSJ9.uj5Sw8NuXyU4aNe89lSgUUT8Q1DyfiWMm_cWPHM7sPsI08FRuwzGRuHkol3ciP9Pl-gOjS9iwXNCWqK3ITzH4CkaU9JiY8-wIaTu-8bxb34tKKk_MMFnstCVEuAXLg3EpZ1rbiVTY809rdtb4KLBcg2WVwn-_CfCnrNF5FMzYng1iJ4Lnz3hgZXAPy-BHYTKPd0PQTCA9uHXAUUfopS5tVcGpARziUeKx2yxDM1mNmCuZn1P8UnpnMnY2rbARxN3-4my7uaafAvAYB6l3-XreZ_-p8QQjEsuW_WRLomXA9VIvKJGdBh_aeFRABn8-RXKpJe7SRAxGfndhrRfeQl_LQ'
