const User = require('../models/User');
const logger = require('../utils/logger');

// Obtener usuario por ID
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    return user;
  } catch (error) {
    logger.error('Error al obtener usuario:', error);
    throw error;
  }
};

// Obtener usuario por email
const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    return user;
  } catch (error) {
    logger.error('Error al obtener usuario por email:', error);
    throw error;
  }
};

// Actualizar saldo del wallet
const updateWalletBalance = async (userId, amount) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    user.wallet.balance += amount;
    
    // Evitar saldos negativos
    if (user.wallet.balance < 0) {
      throw new Error('Saldo insuficiente');
    }
    
    await user.save();
    
    return user;
  } catch (error) {
    logger.error('Error al actualizar saldo:', error);
    throw error;
  }
};

// Obtener portafolio del usuario
const getUserPortfolio = async (email) => {
  try {
    const user = await getByEmail(email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    //console.log('Se recibieron los siguientes datos', user.portfolio);
    
    return user.portfolio;
  } catch (error) {
    logger.error('Error al obtener portafolio:', error);
    throw error;
  }
};

// Crear usuario temporal para pruebas
const createOrUpdateDefaultUser = async () => {
  try {
    // Buscar el usuario default
    let user = await User.findOne({ email: 'default@stockmarket.com' });
    
    if (!user) {
      // Crear usuario default si no existe
      user = new User({
        email: 'default@stockmarket.com',
        name: 'Default User',
        contactInfo: 'System Default User',
        wallet: {
          balance: 10000 // Saldo inicial generoso
        },
        portfolio: [],
        password:"123"
      });
      
      await user.save();
      logger.info('Usuario default creado');
    }
    
    return user;
  } catch (error) {
    logger.error('Error al crear/actualizar usuario default:', error);
    throw error;
  }
};



//Crear Nuevo usuario

const createNewUser = async (email, name) => {
  try {
    // Buscar si el usuario ya existe
    let user = await User.findOne({ email: email });
    
    if (!email || !name == null) {
      throw new Error('Faltan campos requeridos');
    }

    // Si el usuario no existe, crearlo
    if (!user) {
      user = new User({
        email: email,
        name: name,
        contactInfo: 'pending',
        wallet: {
          balance: 0 // Saldo inicial
        },
        portfolio: [],  // Inicializamos un portafolio vacío
        password: 'password'
      });
      
      // Guardar el usuario en la base de datos
      await user.save();
      logger.info('Nuevo usuario creado');
    }

    return user;

  } catch (error) {
    logger.error('Error al crear nuevo usuario:', error);
    throw error;
  }
};




const getUsersFromDatabase = async () => {
  try {
    // Obtener todos los usuarios desde la base de datos
    const users = await User.find();  // Asumiendo que "User" es tu modelo de Mongoose
    
    return users;
  } catch (error) {
    throw new Error('Error al obtener los usuarios de la base de datos');
  }
};


const getByEmail = async (email) => {
  try {
    // Buscar al usuario por su email
    const user = await User.findOne({ email: email });
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user; // Si el usuario existe, lo devolvemos

  } catch (error) {
    // Si no se encuentra el usuario o ocurre algún error, lo manejamos aquí
    logger.error('Error al buscar el usuario:', error);
    throw error; // Lanzamos el error para que el controlador lo maneje
  }
};





module.exports = {
  getUserById,
  getUserByEmail,
  updateWalletBalance,
  getUserPortfolio,
  createOrUpdateDefaultUser,
  createNewUser,
  getUsersFromDatabase,
  getByEmail
};