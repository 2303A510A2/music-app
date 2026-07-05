const mongoose = require('mongoose');

const getMongoUri = () => {
  return (
    process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/mymusic'
  );
};

const maskUri = (uri) => {
  try {
    // hide credentials if present
    const at = uri.indexOf('@');
    if (at === -1) return uri.replace(/:\/\/.*@/, '://***@');
    const start = uri.indexOf('://') + 3;
    const creds = uri.slice(start, at);
    return uri.replace(creds, '***');
  } catch {
    return '***';
  }
};

const connectDB = async (retries = 3, delayMs = 5000) => {
  const uri = getMongoUri();
  console.log('Mongo URI:', maskUri(uri));

  let attempt = 0;
  while (attempt < retries) {
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      attempt += 1;
      console.error(`MongoDB connection error (attempt ${attempt}/${retries}):`, err.message);
      if (attempt < retries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.error('MongoDB connection failed after retries');
        throw err;
      }
    }
  }
};

module.exports = connectDB;
