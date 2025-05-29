const logger = require('../utils/logger');

// Manejador global de errores
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);
  
  // Errores de validación de mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  // Errores de cast de MongoDB (IDs inválidos)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Formato de datos inválido' });
  }
  
  // Errores personalizados con código de estado
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  
  // Error genérico
  res.status(500).json({ error: 'Error interno del servidor' });
};

module.exports = errorHandler;