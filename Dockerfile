

# FROM node:18-alpine 

# WORKDIR /app 

# COPY package.json yarn.lock ./ 

# RUN yarn install --frozen-lockfile --production 

# COPY . . 

# RUN yarn build 

# EXPOSE 3000 

# CMD ["yarn", "start"]




FROM node:18-alpine 

WORKDIR /app 

COPY package.json yarn.lock ./ 

RUN yarn install --frozen-lockfile 

RUN yarn add sass 

COPY . . 


EXPOSE 3000 

CMD ["yarn", "dev"]



