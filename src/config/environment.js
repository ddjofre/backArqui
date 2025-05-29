module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  GROUP_ID: process.env.GROUP_ID,
  MQTT: {
    URL: process.env.MQTT_URL,
    USERNAME: process.env.MQTT_USERNAME,
    PASSWORD: process.env.MQTT_PASSWORD,
    TOPICS: {
      UPDATES: 'stocks/updates',
      REQUESTS: 'stocks/requests',
      VALIDATION: 'stocks/validation'
    }
  }
};