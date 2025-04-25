require('dotenv').config(); //Carregando as variáveis do arquivo
const express = require("express");
const { join } = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(express.static(join(__dirname, "public")));

//Carregamento de variáveis de ambiente para o front
app.get('/config', (req, res) => {
  res.json({ 
    domain:   process.env.AUTH0_DOMAIN, 
    clientId: process.env.AUTH0_CLIENT_ID,
    audience: process.env.AUTH0_API_AUDIENCE,
    api_base_url: process.env.API_BASE_URL
  });
});

//Aqui definimos o entrypoint do nosso serviço web
app.get("/*", (_, res) => {
  // res.sendFile(join(__dirname, "index.html"));
  res.sendFile(join(__dirname, "index.html"));
});

process.on("SIGINT", function() {
  process.exit();
});

module.exports = app;
