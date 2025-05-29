const winston = require('winston');

// Configuración de los formatos
const { combine, timestamp, printf, colorize } = winston.format;

// Formato personalizado
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Crear logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    // Consola para desarrollo
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        myFormat
      )
    }),
    // Archivo para producción
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

module.exports = logger;