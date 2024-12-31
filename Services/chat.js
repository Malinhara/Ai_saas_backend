const express = require('express');
const app = express();
const User = require('../model/user');
const openAi = require("openai");
const config = require('../config'); 

app.use(express.json()); 

// Configure OpenAI API
const conn = new openAi.OpenAI.OpenAI({
    apiKey: config.GPT_CHAT_KEY
});

const ChatService = {

    async chatPersonality(userData) {
        try {
            const { personality, email } = userData;

            if (!email || !personality) {
                throw new Error('Both email and personality fields are required.');
            }

            // Find the user by email
            const user = await User.findOne({ email });

            if (!user) {
                throw new Error('User not found.');
            }

            // Update the personality field
            user.personality = personality;
            await user.save();

            return {
                success: true,
                statusCode: 201,
                message: 'Personality updated successfully.',
                user,
            };
        } catch (error) {
            return {
                success: false,
                statusCode: 500,
                message: error.message,
            };
        }
    },

    async chat(userData) {
        try {
            const { input, email } = userData;
    
            // Ensure both input and email are provided
            if (!input || !email) {
                throw new Error('Both input and email fields are required.');
            }
    
            // Find the user by email to get their personality
            const user = await User.findOne({ email });
    
         
            // Customize system message using the user's personality
            const systemMessage = `You are a chatbot with the personality. You should respond to the 
            user in a way that reflects this personality. Be friendly, helpful, and engaging in your tone.`;
            
            // Call OpenAI API for the response
            const response = await conn.chat.completions.create({
                model: "gpt-4o-mini",  // Ensure the correct model name is used
                messages: [
                    { role: "system", content: systemMessage },  // Include the system message with personality
                    { role: "user", content: input },  // User's input message
                ],
            });
    
            // Extract the reply from the response object
            const reply = response.choices[0].message.content || response.choices[0].text;
    
            return {
                success: true,
                statusCode: 200,
                message: reply,
            };
        } catch (error) {
            return {
                success: false,
                statusCode: 500,
                message: error.message,
            };
        }
    }
    

};

module.exports = ChatService;
