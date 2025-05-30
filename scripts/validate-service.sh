#!/bin/bash

echo "Validating service"

# Verificar que los contenedores estén corriendo
docker ps | grep stock-api
if [ $? -eq 0 ]; then
    echo "API container is running"
else
    echo "API container is not running"
    exit 1
fi

# Verificar health endpoint
sleep 10  # Esperar a que la API esté lista
curl -f http://localhost:3000/health
if [ $? -eq 0 ]; then
    echo "Health check passed"
else
    echo "Health check failed"
    exit 1
fi