require('dotenv').config();
require('./src/models/Stock');
require('./src/models/PurchaseRequest');
require('./src/models/EventLog');
require('./src/models/User');
const mongoose = require('mongoose');
const { connectMQTT } = require('./src/services/mqttService');
const { scheduleReconciliation } = require('./src/services/reconciliationService');
const logger = require('./src/utils/logger');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Conectado a MongoDB');
    
    // Conectar al broker MQTT
    connectMQTT();
    
    // Programar reconciliación periódica
    scheduleReconciliation(60); // cada 60 minutos
  })
  .catch(err => logger.error('Error conectando a MongoDB:', err));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rechazo no manejado en:', promise, 'Razón:', reason);
});