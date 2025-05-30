#!/bin/bash

echo "Stop Application"
cd /home/ubuntu/
docker compose --file docker-compose.production.yml down || true