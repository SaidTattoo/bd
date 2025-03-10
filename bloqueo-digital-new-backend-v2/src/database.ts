import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://root:root@bloqueo_digital_database:27018/sigmadb?authSource=admin';
/* mongoose.connect('mongodb://localhost:27018/nombre_de_tu_base_de_datos', { useNewUrlParser: true, useUnifiedTopology: true }); */
    const options: mongoose.ConnectOptions = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      
    };

    await mongoose.connect(mongoUri, options);
    console.log('MongoDB conectado exitosamente');
    return true;
  } catch (error) {
    console.error('Error de conexión MongoDB:', error);
    return false;
  }
};

export default connectDB;

