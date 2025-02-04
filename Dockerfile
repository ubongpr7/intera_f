FROM node:18-alpine
WORKDIR /app

COPY ./package.json ./yarn.lock* ./

RUN yarn install

RUN yarn add sass
COPY . ./
EXPOSE 80
CMD ["yarn", "dev"]

