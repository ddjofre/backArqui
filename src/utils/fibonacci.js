const fibonacciDelay = (attempt) => {
  if (attempt <= 0) return 0;
  if (attempt === 1) return 6000; // 6 segundos
  if (attempt === 2) return 6000; // 6 segundos
  
  let a = 6, b = 6, temp;
  for (let i = 3; i <= attempt; i++) {
    temp = a + b;
    a = b;
    b = temp;
  }
  return b * 1000; // Convertir a milisegundos
};

module.exports = {
  fibonacciDelay
};