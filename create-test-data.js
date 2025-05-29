require('dotenv').config();
const mongoose = require('mongoose');
const Stock = require('./src/models/Stock');
const User = require('./src/models/User');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock-market')
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    try {
      // Crear stocks de prueba
      const stocks = [
        {
          symbol: 'JNJ',
          price: 150.50,
          shortName: 'Johnson & Johnson',
          longName: 'Johnson & Johnson',
          quantity: 100,
          timestamp: new Date(),
          kind: 'IPO'
        },
        {
          symbol: 'BABA',
          price: 119360,
          shortName: 'Alibaba Group Holding Limited',
          longName: 'Alibaba Group Holding Limited',
          quantity: 5,
          timestamp: new Date(),
          kind: 'IPO'
        },
        {
          symbol: 'META',
          price: 2100.75,
          shortName: 'Meta Platforms, Inc.',
          longName: 'Meta Platforms, Inc.',
          quantity: 50,
          timestamp: new Date(),
          kind: 'IPO'
        }
      ];
      
      // Insertar o actualizar stocks
      for (const stockData of stocks) {
        const existingStock = await Stock.findOne({ symbol: stockData.symbol });
        
        if (existingStock) {
          // Actualizar stock existente
          Object.assign(existingStock, stockData);
          await existingStock.save();
          console.log(`Stock ${stockData.symbol} actualizado`);
        } else {
          // Crear nuevo stock
          const stock = new Stock(stockData);
          await stock.save();
          console.log(`Stock ${stockData.symbol} creado`);
        }
      }
      
      console.log('Datos de prueba creados exitosamente');
    } catch (error) {
      console.error('Error creando datos de prueba:', error);
    } finally {
      await mongoose.disconnect();
      console.log('Desconectado de MongoDB');
    }
  })
  .catch(err => console.error('Error conectando a MongoDB:', err));