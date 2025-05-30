#!/bin/bash

echo "Pulling application"
cd /home/ubuntu/
docker compose --file docker-compose.production.yml pull