
#!/bin/bash

echo "Pulling application"
cd /home/ubuntu/

# Login a ECR público
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

# Pull de las imágenes
docker compose --file docker-compose.production.yml pull