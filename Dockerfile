# syntax = docker/dockerfile:1.2
# Start your image with a node base image
FROM --platform=linux/amd64 node:18-alpine

# The /app directory should act as the main application directory
WORKDIR /app

# Copy the app package and package-lock.json file
COPY package*.json ./

# Copy local directories to the current local directory of our docker image (/app)
COPY . .

# Install node packages, install serve and pm2, build the app, and remove dependencies at the end
RUN npm ci \
    && npm install -g pm2 
# Use secret .env file and print its content
RUN --mount=type=secret,id=_env,dst=/etc/secrets/.env cat /etc/secrets/.env

# Expose the port that the application listens on.
EXPOSE 8080

# Run the application.
CMD npm start
