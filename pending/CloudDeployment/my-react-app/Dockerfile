FROM node:18-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
# This leverages Docker's layer caching.
COPY package.json package-lock.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Run the build script to create the optimized production build
RUN npm run build

# --- STAGE 2: The Production Stage ---
# Use a lightweight Nginx image as the new base
FROM nginx:1.25-alpine

# Copy the build output (static files) from the "build" stage
# The output of "npm run build" is in the /app/build folder
COPY --from=build /app/build /usr/share/nginx/html

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (the default port for Nginx)
EXPOSE 80

# The default command to start Nginx (good to be explicit)
CMD ["nginx", "-g", "daemon off;"]