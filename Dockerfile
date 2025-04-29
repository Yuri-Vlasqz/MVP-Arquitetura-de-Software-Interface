FROM node:20.19.1-slim

RUN mkdir /app

WORKDIR /app

COPY package.json .

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "bin/www"]