const mqtt = require('mqtt');
const { MQTT } = require('./environment');

const getMQTTClient = () => {
  return mqtt.connect(MQTT.URL, {
    username: MQTT.USERNAME,
    password: MQTT.PASSWORD,
    clientId: `stock-market-${process.env.GROUP_ID}-${require('crypto').randomUUID()}`
  });
};

module.exports = {
  getMQTTClient,
  TOPICS: MQTT.TOPICS
};