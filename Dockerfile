# Use Node.js 18 Alpine version
FROM node:18-alpine 

# Set the working directory
WORKDIR /app 

# Copy package.json and yarn.lock separately for better caching
COPY package.json yarn.lock ./ 

# Install dependencies
RUN yarn install --frozen-lockfile 

# Add SASS (if not already in package.json)
RUN yarn add sass 

# Copy the rest of the application files
COPY . . 

# Build the Next.js app for production
# RUN yarn dev 

# Expose port 80
EXPOSE 3000 

# Start the Next.js production server
CMD ["yarn", "dev"]
