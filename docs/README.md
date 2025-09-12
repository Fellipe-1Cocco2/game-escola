# Meu Projeto Express


## Estrutura do Projeto

- **config/db.js**: Configuração para conectar ao banco de dados MongoDB.
- **controllers/userController.js**: Controlador que lida com a lógica de cadastro de usuários.
- **models/User.js**: Define a estrutura do documento do usuário no MongoDB.
- **routes/userRoutes.js**: Define as rotas para operações relacionadas a usuários.
- **server.js**: Ponto de entrada da aplicação, configura o servidor e as rotas.
- **package.json**: Configuração do npm com dependências e scripts.

## Instalação

1. Clone o repositório.
2. Instale as dependências com `npm install`.
3. Configure a variável de ambiente `MONGO_URI` com a URL do seu banco de dados MongoDB.
4. Inicie o servidor com `npm start`.

## Rotas

- `POST /api/users/register`: Cadastra um novo usuário.