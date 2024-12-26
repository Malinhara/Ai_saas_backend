const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = "mongodb+srv://poornainvest0:kkswVuGWJvCJechn@aiapp.iog0q.mongodb.net/?retryWrites=true&w=majority&appName=Aiapp";
    if (!uri) throw new Error('MongoDB URI is not defined');
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
