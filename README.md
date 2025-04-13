# MVP-Arquitetura-de-Software-Interface

Este repositório contém a implementação do front-end do **MVP** (_Minimum Viable Product_) da _Sprint_ de **Arquitetura de Software** do Curso de Engenharia de Software da PUC-Rio.
A parte do back-end pode ser acessada em [MVP-Arquitetura-de-Software-API](https://github.com/Yuri-Vlasqz/MVP-Arquitetura-de-Software-API).

No contexto da crescente variedade de serviços de streaming e da variação de conteúdo de acordo com a localização geográfica, foi criado esse projeto:
> A aplicação web, **"Tudo a ver 2.0"**, permite a busca de séries e filmes disponíveis em todas plataformas de _streaming_ de qualquer país. Além disso, ao fazer o login, cada usuário pode criar e customizar, de forma protegida, suas próprias listas de programas, descobrindo em um clique, onde assistir em qualquer lugar que estiver.


## Arquitetura da aplicação:

<p align="center">
  <img src="assets/Fluxograma%20de%20arquitetura%20de%20MVP.png">
</p>
<h6 align="center">Fluxograma - Cenário 1.1</h6>


#### O contêiner Node.js representa o conteúdo deste repositório:
- As requisições da Interface SPA para a API Flask são feitas seguindo o padrão _REST_.
- A autenticação de usuários, assim como, a obtenção dos tokens de acesso da API Flask, é feita utilizando o serviço externo, _Auth0_.

#### O contêiner Python representa o conteúdo do repositório [MVP-Arquitetura-de-Software-API](https://github.com/Yuri-Vlasqz/MVP-Arquitetura-de-Software-API).
<br>

## Funcionalidades da Interface:

- Login/cadastro de usuários autenticados.
- Busca de programas por título/nome, independente da linguagem.
- Exploração de detalhes e de provedores mundiais de _streaming_ de um programa.
- Criação e edição de listas e seus programas associados.


<p align="center">
  <img src="assets\SPA-layout.png">
</p>
<h6 align="center">Layout da Interface</h6>

<br>

## Tecnologias principais

Esta SPA (_Single Page Application_), utiliza as seguintes tecnologias:
- HTML, CSS, JavaScript.
- Express (Node.js)

<br>

## Configuração da API externa

#### Configuração do Auth0 para autenticação de usuários:
1. Crie uma conta no [Auth0](https://auth0.com/).
2. Crie uma aplicação do tipo SPA no [painel Auth0](https://auth0.com/docs/get-started/auth0-overview/dashboard) e obtenha esses valores:
    - `Domain`
    - `Client ID`
3. Configure os campos da aplicação SPA com os seguintes valores:
    - Allowed Callback URLs: `http://localhost:3000, http://localhost:5000`
    - Allowed Logout URLs: `http://localhost:3000, http://localhost:5000`
    - Allowed Web Origins: `http://localhost:3000, http://localhost:5000`
    - Ative o botão `Allowed Cross-Origin Authentication`
        - Allowed Origins (CORS): `http://localhost:3000, http://localhost:5000`

4. Na [aplicação API](https://github.com/Yuri-Vlasqz/MVP-Arquitetura-de-Software-API?tab=readme-ov-file#configura%C3%A7%C3%A3o-do-auth0-para-proteger-rotas), configurada no repositorio do back-end, no painel Auth0 obtenha esse valor:
    - `API Identifier`


## Configuração das variáveis de ambiente
No diretório raiz do repositório, crie o arquivo `.env` e preencha com os valores obtidos na API externa, conforme abaixo:
```sh
AUTH0_DOMAIN="Domain"
AUTH0_CLIENT_ID="Client ID"
AUTH0_API_AUDIENCE="API Identifier"
```

<br>

## Instalação e Execução

**Clone este repositório, e siga as intruções para uma das formas de executar a Interface.**


#### Execução pelo [npm](https://www.npmjs.com/):

1. No diretório raiz do repositório, instale as dependências:
   ```sh
   npm install
   ```
2. Inicie o servidor:
   ```sh
   npm run dev
   ```
<br>

#### Execução pelo arquivo Dockerfile, através do [Docker](https://www.docker.com/):

1. No diretório raiz do repositório, pelo terminal, crie a imagem do código:
   ```
   docker build -t mvp_interface .
   ```
2. Execute a imagem criada no Docker:
   ```
   docker run -p 3000:3000 mvp_interface
   ```

<br>

#### Use a SPA em execução:

1. Acesse `http://localhost:3000/` para abrir a aplicação web.
2. Realize o cadastro e login via Auth0 na janela pop-up.
3. O token de autenticação será armazenado e enviado, no header `Bearer <token>` das requisições, para acessar as rotas protegida do back-end.
