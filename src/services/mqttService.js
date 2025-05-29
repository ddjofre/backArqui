const { getMQTTClient, TOPICS } = require('../config/mqtt');
const { GROUP_ID } = require('../config/environment');
const Stock = require('../models/Stock');
const PurchaseRequest = require('../models/PurchaseRequest');
const EventLog = require('../models/EventLog');
const User = require('../models/User');
const { updateStockQuantity } = require('./stockService');
const { fibonacciDelay } = require('../utils/fibonacci');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { getByEmail } = require('./userService');

let client;
let retryCount = 0;

// Conectar al broker MQTT
const connectMQTT = () => {
  try {
    client = getMQTTClient();

    client.on('connect', () => {
      logger.info('Conectado al broker MQTT');
      retryCount = 0;
      
      // Suscribirse a los canales
      client.subscribe(TOPICS.UPDATES, (err) => {
        if (!err) logger.info(`Suscrito a ${TOPICS.UPDATES}`);
      });
      
      client.subscribe(TOPICS.VALIDATION, (err) => {
        if (!err) logger.info(`Suscrito a ${TOPICS.VALIDATION}`);
      });
      
      client.subscribe(TOPICS.REQUESTS, (err) => {
        if (!err) logger.info(`Suscrito a ${TOPICS.REQUESTS}`);
      });
    });

    client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        logger.info(`Mensaje recibido en ${topic}: ${message.toString()}`);
        
        switch (topic) {
          case TOPICS.UPDATES:
            await handleStockUpdate(payload);
            break;
          case TOPICS.REQUESTS:
            // Es una solicitud externa de otro grupo
            if (payload.group_id && payload.group_id !== GROUP_ID) {
              logger.info(`Procesando como solicitud externa: ${JSON.stringify(payload)}`);
              await handleExternalRequest(payload);
            }
            // Es nuestra propia solicitud
            else if (payload.group_id && payload.group_id === GROUP_ID) {
              return
            }
            // Es una validación de tipo "OK" (ignorar)
            else if (payload.status === 'OK') {
              return
            }
            // Es una validación para una de nuestras solicitudes
            else if (payload.status && payload.request_id) {
              // Verificar primero si es una solicitud nuestra
              const ownRequest = await PurchaseRequest.exists({ request_id: payload.request_id });
              
              if (ownRequest) {
                logger.info(`Procesando como validación para nuestra solicitud: ${JSON.stringify(payload)}`);
                await handleValidation(payload);
              } else {
                return
                // No procesamos validaciones de solicitudes que no son nuestras
              }
            }
            // Si no cumple ninguna condición anterior, registramos para depuración
            else {
              logger.warn(`Mensaje no identificado en ${topic}: ${JSON.stringify(payload)}`);
            }
            break;
        }
      } catch (error) {
        logger.error(`Error procesando mensaje de ${topic}:`, error);
      }
    });

    client.on('error', (err) => {
      logger.error('Error en conexión MQTT:', err);
    });

    client.on('close', () => {
      logger.info('Conexión MQTT cerrada');
      retryConnection();
    });

    return client;
  } catch (error) {
    logger.error('Error estableciendo conexión MQTT:', error);
    retryConnection();
  }
};

// Reintentar conexión con delay Fibonacci
const retryConnection = () => {
  retryCount++;
  const delay = fibonacciDelay(retryCount);
  logger.info(`Reintentando conexión en ${delay/1000} segundos (intento ${retryCount})...`);
  
  setTimeout(() => {
    connectMQTT();
  }, delay);
};

// Manejar actualizaciones de stocks
const handleStockUpdate = async (payload) => {
  try {
    if (payload.kind === 'UPDATE') {
      // Actualizar precio de stock existente
      const stock = await Stock.findOne({ symbol: payload.symbol });
      
      if (!stock) {
        stock = new Stock({
          symbol: payload.symbol,
          price: payload.price,
          shortName: payload.shortName || payload.symbol,
          longName: payload.longName || payload.symbol,
          quantity: payload.quantity || 0,
          timestamp: new Date(payload.timestamp),
          kind: payload.kind
        });
        await stock.save();
        logger.info(`Nuevo stock creado: ${payload.symbol}`);
        return;
      }
      
      stock.price = payload.price;
      stock.timestamp = new Date(payload.timestamp);
      stock.kind = payload.kind;
      await stock.save();
      
    } else {
      // IPO o EMIT
      let stock = await Stock.findOne({ symbol: payload.symbol });
      
      if (!stock && payload.kind === 'IPO') {
        // Crear nuevo stock para IPO
        stock = new Stock({
          symbol: payload.symbol,
          price: payload.price,
          shortName: payload.shortName || payload.symbol,
          longName: payload.longName || payload.symbol,
          quantity: payload.quantity || 0,
          timestamp: new Date(payload.timestamp),
          kind: payload.kind
        });
        await stock.save();
        logger.info(`Nuevo stock IPO creado: ${payload.symbol}`);
      } else if (stock && payload.kind === 'EMIT') {
        // Actualizar stock existente para EMIT
        stock.price = payload.price;
        stock.quantity += payload.quantity;
        stock.timestamp = new Date(payload.timestamp);
        stock.kind = payload.kind;
        await stock.save();
        logger.info(`Stock actualizado por EMIT: ${payload.symbol}`);
      } else if (!stock && payload.kind === 'EMIT') {
        stock = new Stock({
          symbol: payload.symbol,
          price: payload.price,
          shortName: payload.shortName || payload.symbol,
          longName: payload.longName || payload.symbol,
          quantity: payload.quantity || 0,
          timestamp: new Date(payload.timestamp),
          kind: payload.kind
        });
        await stock.save();
        logger.info(`Nuevo stock creado: ${payload.symbol}`);
      }
      else {
        logger.warn(`Recibido ${payload.kind} para stock ${payload.symbol} en estado inválido.`);
        return; // Salir si es un caso no manejable
      }
    }
    
    // Registrar evento
    await new EventLog({
      type: payload.kind,
      data: payload
    }).save();
    
    logger.info(`Stock ${payload.symbol} actualizado: ${payload.kind}`);
  } catch (error) {
    logger.error('Error procesando actualización de stock:', error);
  }
};

// Manejar validaciones de compras
// Manejar validaciones de compras
const handleValidation = async (payload) => {
  try {
    const { request_id, status, reason } = payload;
    
    if (!request_id) {
      logger.error(`Payload de validación sin request_id: ${JSON.stringify(payload)}`);
      return;
    }
    
    logger.info(`Procesando validación para solicitud ${request_id} con status ${status}`);
    
    // Buscar solicitud en la base de datos
    const request = await PurchaseRequest.findOne({ request_id }).populate('user');
    
    if (!request) {
      logger.error(`Solicitud no encontrada: ${request_id}`);
      return;
    }
    
    // Actualizar estado
    request.status = status;
    request.reason = reason || '';
    
    if (status === 'ACCEPTED') {
      // Si fue aceptada, actualizar el portafolio del usuario
      const user = request.user;
      
      if (!user) {
        logger.error(`Usuario no encontrado para la solicitud: ${request_id}`);
        return;
      }
      
      logger.info(`Actualizando portafolio para usuario ${user._id}, solicitud ${request_id}`);
      
      // Buscar si ya tiene este stock en su portafolio
      const portfolioIndex = user.portfolio.findIndex(item => item.symbol === request.symbol);
      
      if (portfolioIndex !== -1) {
        // Actualizar cantidad y precio promedio
        const currentItem = user.portfolio[portfolioIndex];
        const totalQuantity = currentItem.quantity + request.quantity;
        const totalInvested = (currentItem.totalInvested || currentItem.averagePrice * currentItem.quantity) + (request.price * request.quantity);
        
        user.portfolio[portfolioIndex].quantity = totalQuantity;
        user.portfolio[portfolioIndex].totalInvested = totalInvested;
        user.portfolio[portfolioIndex].averagePrice = totalInvested / totalQuantity;
        
        logger.info(`Stock actualizado en portafolio: ${request.symbol}, nueva cantidad: ${totalQuantity}`);
      } else {
        // Añadir nuevo ítem al portafolio
        user.portfolio.push({
          symbol: request.symbol,
          quantity: request.quantity,
          averagePrice: request.price,
          totalInvested: request.price * request.quantity
        });
        
        logger.info(`Nuevo stock añadido al portafolio: ${request.symbol}, cantidad: ${request.quantity}`);
      }
      
      // Restar del wallet
      const cost = request.price * request.quantity;
      logger.info(`Restando ${cost} del saldo. Saldo anterior: ${user.wallet.balance}`);
      
      user.wallet.balance -= cost;
      
      // Asegurar que el balance no sea negativo
      if (user.wallet.balance < 0) {
        user.wallet.balance = 0;
      }
      
      logger.info(`Nuevo saldo del usuario: ${user.wallet.balance}`);
      
      await user.save();
      
      // Registrar evento
      await new EventLog({
        type: 'OWN_PURCHASE',
        data: {
          request_id: request.request_id,
          user: user._id,
          symbol: request.symbol,
          quantity: request.quantity,
          price: request.price,
          status
        }
      }).save();
      
      logger.info(`Evento registrado para compra exitosa: ${request_id}`);
      
    } else if (status === 'REJECTED' || status === 'NOT_VALID' || status === 'error') {
      // Si fue rechazada o es un error, devolver las acciones al inventario local
      try {
        await updateStockQuantity(request.symbol, request.quantity);
        logger.info(`Acciones devueltas al inventario por rechazo/error: ${request.quantity} de ${request.symbol}`);
      } catch (error) {
        logger.error(`Error al devolver acciones al inventario: ${error.message}`);
      }
    }
    
    await request.save();
    
    logger.info(`Validación procesada para solicitud ${request_id}: ${status}`);
    // Actualizar el estado de la solicitud en la base de datos
    await request.save(); // Guardar cambios en la solicitud
  } catch (error) {
    logger.error('Error procesando validación:', error);
  }
};

// Manejar solicitudes externas
const handleExternalRequest = async (payload) => {
  try {
    // Ignorar mensajes de respuesta
    if (payload.kind === 'response') {
      return;
    }
    
    const { request_id, symbol, quantity, group_id } = payload;
    
    if (!symbol || !quantity) {
      logger.warn(`Solicitud externa inválida recibida: ${JSON.stringify(payload)}`);
      return;
    }
    
    // Registrar evento
    await new EventLog({
      type: 'EXTERNAL_PURCHASE',
      data: payload
    }).save();
    
    try {
      // Verificar si el stock existe
      let stock = await Stock.findOne({ symbol });
      
      // Si el stock no existe, crearlo primero
      if (!stock) {
        logger.info(`Creando nuevo stock para solicitud externa: ${symbol}`);
        stock = new Stock({
          symbol,
          price: payload.price || 0,
          shortName: payload.shortName || symbol,
          longName: payload.longName || symbol,
          quantity: 0,
          timestamp: new Date(),
          kind: 'EMIT' // Usar un valor de enum válido según tu modelo
        });
        await stock.save();
        logger.info(`Nuevo stock creado para solicitud externa: ${symbol}`);
      }
      
      // Actualizar cantidad disponible en nuestro inventario local
      await updateStockQuantity(symbol, -quantity);
      logger.info(`Solicitud externa procesada: Grupo ${group_id}, ${quantity} de ${symbol}`);
    } catch (error) {
      logger.error(`Error al procesar solicitud externa para ${symbol}:`, error);
    }
  } catch (error) {
    logger.error('Error procesando solicitud externa:', error);
  }
};

// Enviar solicitud de compra
const sendPurchaseRequest = async (email, symbol, quantity) => {
  try {
    if (!client || !client.connected) {
      throw new Error('Cliente MQTT no conectado');
    }
    
    // Verificar si hay stock disponible
    const stock = await Stock.findOne({ symbol });
    
    if (!stock) {
      throw new Error(`Stock con símbolo ${symbol} no encontrado`);
    }
    
    if (stock.quantity < quantity) {
      throw new Error('No hay suficiente stock disponible');
    }
    
    // Obtener información del usuario
    const user = await getByEmail(email);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // Verificar si tiene fondos suficientes
    const cost = stock.price * quantity;
    
    if (user.wallet.balance < cost) {
      throw new Error('Saldo insuficiente');
    }
    
    // Reservar stock (restar del inventario)
    stock.quantity -= quantity;
    await stock.save();
    
    // Crear solicitud
    const request_id = uuidv4();
    
    const purchaseRequest = new PurchaseRequest({
      request_id,
      user: user._id,
      symbol,
      quantity,
      price: stock.price,
      status: 'PENDING'
    });
    
    await purchaseRequest.save();
    
    const message = {
      request_id,
      group_id: GROUP_ID,
      quantity,
      symbol,
      operation: "BUY"
    };
    
    // Publicar en el broker con reintento
    await publishWithRetry(TOPICS.REQUESTS, message);
    
    return purchaseRequest;
  } catch (error) {
    logger.error('Error enviando solicitud de compra:', error);
    throw error;
  }
};

// Publicar con reintento
const publishWithRetry = async (topic, message, attempt = 0, maxAttempts = 5) => {
  return new Promise((resolve, reject) => {
    if (!client || !client.connected) {
      if (attempt >= maxAttempts) {
        return reject(new Error(`Máximo de intentos alcanzado al publicar en ${topic}`));
      }
      
      const delay = fibonacciDelay(attempt);
      logger.info(`Cliente MQTT no conectado. Reintentando en ${delay/1000} segundos...`);
      
      setTimeout(() => {
        publishWithRetry(topic, message, attempt + 1, maxAttempts)
          .then(resolve)
          .catch(reject);
      }, delay);
      
      return;
    }
    
    client.publish(topic, JSON.stringify(message), (err) => {
      if (err) {
        if (attempt >= maxAttempts) {
          return reject(new Error(`Máximo de intentos alcanzado al publicar en ${topic}`));
        }
        
        const delay = fibonacciDelay(attempt);
        logger.info(`Error al publicar en ${topic}. Reintentando en ${delay/1000} segundos...`);
        
        setTimeout(() => {
          publishWithRetry(topic, message, attempt + 1, maxAttempts)
            .then(resolve)
            .catch(reject);
        }, delay);
      } else {
        logger.info(`Mensaje publicado en ${topic}`);
        resolve();
      }
    });
  });
};

module.exports = {
  connectMQTT,
  sendPurchaseRequest
};