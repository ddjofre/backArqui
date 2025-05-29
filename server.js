require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');
const { connectMQTT } = require('./src/services/mqttService');
const { scheduleReconciliation } = require('./src/services/reconciliationService');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const yaml = require('yaml');
//auth0:
const { auth } = require('express-oauth2-jwt-bearer');
const jwt = require('jsonwebtoken');


const app = express();

// Enhanced CORS Configuration
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Authorization', 'X-Total-Count'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 3600
};

// Apply CORS middleware early
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly
app.options('*', cors(corsOptions), (req, res) => {
  res.sendStatus(200); // <-- Use 200 instead of 204
});

// Cargar OpenAPI YAML
const openapiDocument = yaml.parse(fs.readFileSync('./openapi.yaml', 'utf8'));

// Configuración de Auth0
const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: 'RS256'
});

// Other middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// CORS debugging middleware
app.use((req, res, next) => {
  logger.debug('CORS middleware executed for:', req.method, req.path);
  next();
});

// Health check - unprotected
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Documentación OpenAPI - unprotected
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Conectado a MongoDB');
    
    // Conectar al broker MQTT
    connectMQTT();
    
    // Programar reconciliación periódica
    scheduleReconciliation(60); // cada 60 minutos
  })
  .catch(err => logger.error('Error conectando a MongoDB:', err));

// Improved handling of protected routes - ensure OPTIONS requests bypass authentication
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  jwtCheck(req, res, next);
}, routes);

// Manejador de errores
app.use(errorHandler);

// Ejecutamos.
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {  // Escuchar en todas las interfaces
  logger.info(`Servidor corriendo en puerto ${PORT}`);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rechazo no manejado en:', promise, 'Razón:', reason);
});