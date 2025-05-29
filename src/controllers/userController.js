const { getUserById, updateWalletBalance, getUserPortfolio, createOrUpdateDefaultUser, createNewUser, getUsersFromDatabase, getByEmail} = require('../services/userService');
const logger = require('../utils/logger');

// Obtener información del usuario por defecto
const getDefaultUser = async (req, res) => {
  try {
    const user = await createOrUpdateDefaultUser();
    
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      contactInfo: user.contactInfo,
      walletBalance: user.wallet.balance
    });
  } catch (error) {
    logger.error('Error en controlador getDefaultUser:', error);
    res.status(500).json({ error: 'Error al obtener información del usuario' });
  }
};

// Recargar wallet del usuario por defecto
const rechargeDefaultWallet = async (req, res) => {
  try {
    const { amount, email } = req.body;
    console.log('Se recibieron los siguientes datos:', req);
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'El monto debe ser positivo' });
    }
    
    const user = await getByEmail(email);
    
    // Actualizar el saldo
    user.wallet.balance += amount;
    await user.save();
    
    res.json({
      message: 'Wallet recargado exitosamente',
      walletBalance: user.wallet.balance
    });
  } catch (error) {
    logger.error('Error en controlador rechargeDefaultWallet:', error);
    res.status(500).json({ error: 'Error al recargar wallet' });
  }
};

// Obtener portafolio del usuario por defecto
const getDefaultPortfolio = async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Se recibieron los siguientes datos', email);
    const portfolio = await getUserPortfolio(email);
    res.json(portfolio);
    return portfolio;
  } catch (error) {
    logger.error('Error en controlador getDefaultPortfolio:', error);
    res.status(500).json({ error: 'Error al obtener portafolio' });
  };
};



//Crear nuevo usuario
const createUser = async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name == null) {
      return res.status(400).json({ error: 'Falta algun campo requerido' });
    }
    
    const user = await createNewUser(email, name);
    
    await user.save();
    
    res.json({
      message: 'Usuario creado exitosamente',
      user: {
        email: user.email,
        name: user.name
      }  

    });
  } catch (error) {
    logger.error('Error en controlador rechargeDefaultWallet:', error);
    res.status(500).json({ error: 'Error al recargar wallet' });
  }
};


const getAllUsers = async (req, res) => {
  try {
    // Llamar a la función intermedia para obtener los usuarios
    const users = await getUsersFromDatabase();
    
    // Si no se encuentran usuarios, responder con un mensaje adecuado
    if (users.length === 0) {
      return res.status(404).json({ message: 'No se encontraron usuarios' });
    }
    
    // Responder con los usuarios obtenidos
    res.json({
      message: 'Usuarios obtenidos exitosamente',
      users: users
    });
  } catch (error) {
    logger.error('Error en controlador getAllUsers:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};


// Buscar usuario por email
// Controlador para obtener el usuario por su email
const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;  // Obtener el email desde los parámetros de la URL

    // Llamar a createNewUser para buscar al usuario por email
    const user = await getByEmail(email);

    res.json({
      message: 'Usuario encontrado',
      user: {
        email: user.email,
        name: user.name,
        walletBalance: user.wallet.balance,  // Mostrar saldo de la wallet
      }
    });
  } catch (error) {
    logger.error('Error al buscar el usuario:', error);
    res.status(404).json({ error: 'Usuario no encontrado' }); // Si el usuario no se encuentra
  }
};











module.exports = {
  getDefaultUser,
  rechargeDefaultWallet,
  getDefaultPortfolio, 
  createUser,
  getAllUsers,
  getUserByEmail
};