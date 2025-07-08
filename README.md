# Feedback Demo App

This repository contains a very small feedback application with a front-end and a back-end service.

* **frontend/** – Static HTML page served by Nginx
* **backend/** – Node.js Express API using SQLite

## Running Locally with Docker Compose

1. Build and start the containers:
   ```bash
   docker compose up --build
   ```
   - Frontend will be available at [http://localhost:8080](http://localhost:8080)
   - Backend API listens on port `3001`

2. Open the frontend URL and register a user, log in, and post messages.

## Deploying to AWS ECS (Fargate)

1. **Build container images** and push them to a registry (e.g. Amazon ECR):
   ```bash
   # From repository root
   docker build -t my-backend ./backend
   docker build -t my-frontend ./frontend
   # Tag and push to ECR
   ```
2. **Create ECS task definitions** for both services or a single task with two containers. Map the container ports the same way as in `docker-compose.yml` (3001 and 80).
3. **Create an ECS service** using the task definition and choose Fargate as the launch type. Set up a load balancer or assign public IPs.
4. **Provision a database volume**. In this demo the backend uses a local SQLite file, so you may want to mount an EFS volume or switch to an RDS database for production use.
5. Deploy the service and access the frontend through the load balancer URL.

This is only a minimal demo. For production usage you should add HTTPS, secure session storage, persistent databases, and other best practices.
