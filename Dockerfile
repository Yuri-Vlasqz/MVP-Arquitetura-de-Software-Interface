FROM node:20.18.1

RUN mkdir /app

WORKDIR /app

COPY package.json .

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "bin/www"]