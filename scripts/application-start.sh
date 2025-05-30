
#!/bin/bash

echo "Application starting"
cd /home/ubuntu/
docker compose --file docker-compose.production.yml up -d