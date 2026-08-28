# 🚀 Sistema de Gestão de Patrimônio e Manutenções - Projeto Integrador II (UNIVESP)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Este projeto foi desenvolvido como parte do **Projeto Integrador II** do curso de Bacharelado em Tecnologia da Informação (BTI) da **Universidade Virtual do Estado de São Paulo (UNIVESP)**.

Trata-se de uma API RESTful de alta performance projetada para resolver problemas reais de gestão de ativos corporativos e registros de manutenções. Construída sob os pilares da arquitetura limpa, a aplicação utiliza **Fastify** para máxima velocidade de processamento e **Prisma ORM** com **PostgreSQL** para persistência relacional confiável.

---

## 🛠️ Tecnologias Utilizadas

- **Runtime**: Node.js (ES Modules)
- **Framework Web**: Fastify
- **ORM**: Prisma (PostgreSQL)
- **Validação de Schemas**: TypeBox (Integração nativa com o ecossistema Fastify para validação super rápida)
- **Segurança**: JSON Web Token (JWT) e Bcryptjs para hashing de senhas
- **Containerização**: Docker & Docker Compose

---

## 🚀 Funcionalidades Principais

### 🏢 Gestão de Patrimônio e Infraestrutura

- **Controle Hierárquico de Espaços:** Cadastro estruturado de Prédios e Locais.
- **Categorização de Ativos:** Organização por Grupos, Categorias e Marcas.
- **Inventário de Equipamentos:** Rastreamento completo com número de patrimônio, valor do bem, capacidade, situação e localização exata.
- **Gestão de Fornecedores:** Controle de empresas prestadoras de serviço (CNPJ, Razão Social, Contatos).

### 🔧 Sistema de Manutenção (Padrão Master-Detail)

- **Otimização de Payload:** Implementação arquitetural Master-Detail para evitar sobrecarga de dados. A listagem de manutenções trafega apenas os dados principais (Nota Fiscal, Data, Empenho) e a _contagem_ de serviços.
- **Paginação de Sub-recursos:** Serviços e itens vinculados a uma manutenção são carregados sob demanda através de rotas dedicadas e paginadas.
- **Gatilhos em Cascata:** Relacionamentos rígidos no banco de dados garantindo exclusão segura (Cascade) de itens quando uma ordem de manutenção é removida.

### 🛡️ Segurança e RBAC (Role-Based Access Control)

- **Autenticação Avançada:** Fluxo completo baseado em JWT contendo `accessToken` e `refreshToken` persistido.
- **Controle de Permissões:** Níveis de acesso estruturados em `user`, `admin` e `root`, restringindo a deleção de ativos corporativos apenas para gestores.
- **Validação Rigorosa (TypeBox):** Todos os _bodies_, _params_ e _queries_ da API são higienizados e tipados estritamente antes de tocarem a camada de serviço.

---

## 🛠️ Arquitetura de Pastas

```text
├── logs/                    # Arquivos de log gerados pela aplicação
├── prisma/                  # Arquivos e configurações do Prisma ORM
│   ├── migrations/          # Histórico de versionamento do banco de dados
│   ├── schema.prisma        # Modelagem das tabelas do banco
│   └── seed.js              # Script para popular os dados iniciais
├── src/                     # Código-fonte principal da API
│   ├── config/              # Configurações de banco de dados e plugins
│   ├── controllers/         # Lógica de controle das requisições e respostas
│   ├── docs/                # Arquivos e definições do Swagger (API Docs)
│   ├── middlewares/         # Interceptadores (Upload, Autenticação, Permissões)
│   ├── models/              # Schemas de validação estrita (TypeBox)
│   ├── routes/              # Mapeamento e definição de todos os endpoints
│   ├── services/            # Camada com as regras de negócio e comunicação com BD
│   ├── templates/           # Templates de corpo de e-mail e mensagens
│   ├── utils/               # Funções auxiliares, paginação e tratamento de erros
│   ├── app.js               # Instância do Fastify e registro global de rotas
│   └── server.js            # Ponto de entrada que levanta o servidor HTTP
├── uploads/                 # Diretório de armazenamento de arquivos estáticos (ex: avatares)
├── .dockerignore            # Arquivos ignorados na criação da imagem Docker
├── .env                     # Variáveis de ambiente sensíveis (ignorado no Git)
├── .env.example             # Template público das variáveis de ambiente necessárias
├── .gitignore               # Arquivos e pastas ignorados no controle de versão
├── .prettierrc              # Configurações e regras de formatação do código
├── dados_manutencao.json    # Seed de dados do sistema
├── docker-compose.yml       # Arquivo de orquestração dos serviços (Node + Postgres)
├── Dockerfile               # Instruções de build da imagem da aplicação
├── entrypoint.sh            # Script de inicialização executado dentro do container
├── eslint.config.js         # Regras de linting para qualidade e padronização do código
├── jsconfig.json            # Configurações de caminhos absolutos para o IntelliSense
├── package-lock.json        # Árvore com as versões exatas das dependências instaladas
├── package.json             # Metadados do projeto, dependências principais e scripts
├── prisma.config.js         # Configurações adicionais de inicialização do Prisma
└── README.md                # Documentação central do projeto
```

---

## 🏁 Primeiros Passos

### 📋 Pré-requisitos

- **Docker** e **Docker Compose** instalados localmente.
- Gerenciador de pacotes **npm** (ou yarn/pnpm).

### 🔧 Instalação e Execução

1. **Clone o Repositório:**

   ```bash
   git clone https://github.com/pedromaggot38/manutencao-equipamentos-pi-ii
   cd manutencao-equipamentos-pi-ii
   ```

2. **Configure as Variáveis de Ambiente:**
   Copie o arquivo de exemplo e ajuste as credenciais do PostgreSQL e chaves JWT:

   ```bash
   cp .env.example .env
   ```

3. **Suba o Ambiente via Docker:**
   O compose cuidará de compilar a imagem Node.js e instanciar o banco PostgreSQL isolado:
   ```bash
   docker compose up --build
   ```

A API estará disponível por padrão em `http://localhost:3000`.

---

## 🌐 Mapeamento Completo de Rotas da API

### 🔐 1. Autenticação (`/api/v1/auth`)

Gerencia o fluxo de credenciais, setup inicial e recuperação de senhas. Todas as rotas aqui são **públicas** (não exigem token).

| Rota               | Método | Descrição                                                      |
| :----------------- | :----: | :------------------------------------------------------------- |
| `/setup`           | `GET`  | Verifica se o sistema já possui um usuário `root` configurado. |
| `/setup`           | `POST` | Cria o primeiro usuário do sistema (forçado como `root`).      |
| `/signup`          | `POST` | Criação de conta padrão para novos usuários comuns.            |
| `/signin`          | `POST` | Autentica o usuário e retorna `accessToken` / `refreshToken`.  |
| `/refresh`         | `POST` | Gera um novo token de acesso usando o Refresh Token válido.    |
| `/signout`         | `POST` | Encerra a sessão e invalida os tokens.                         |
| `/forgot-password` | `POST` | Envia um código OTP para o e-mail para recuperação de senha.   |
| `/reset-password`  | `POST` | Redefine a senha do usuário utilizando o código OTP.           |

---

### 👤 2. Perfil do Usuário Logado (`/api/v1/me`)

Gerencia as informações da própria conta. Requer autenticação (`protect`).

| Rota          | Método  | Descrição                                               |
| :------------ | :-----: | :------------------------------------------------------ |
| `/`           |  `GET`  | Retorna os dados completos do usuário logado.           |
| `/`           | `PATCH` | Atualiza os dados cadastrais próprios e/ou avatar.      |
| `/password`   | `PATCH` | Altera a senha atual do usuário.                        |
| `/activation` | `POST`  | Solicita um novo token OTP para ativar a própria conta. |
| `/activation` | `PATCH` | Valida o OTP e ativa a conta no sistema.                |
| `/email`      | `POST`  | Solicita a alteração do e-mail principal (envia OTP).   |
| `/email`      | `PATCH` | Valida o OTP e efetiva o novo e-mail.                   |
| `/deactivate` | `PATCH` | Desativa a própria conta temporariamente.               |

---

### 👑 3. Gestão de Usuários (`/api/v1/users`)

Módulo administrativo. Requer autenticação e nível hierárquico elevado (`root` ou `admin`).

| Rota                       |  Método  | Descrição                                                      |    Restrição    |
| :------------------------- | :------: | :------------------------------------------------------------- | :-------------: |
| `/`                        |  `GET`   | Lista todos os usuários cadastrados de forma paginada.         | `admin`, `root` |
| `/`                        |  `POST`  | Cria um usuário ativando e definindo seu cargo diretamente.    | `admin`, `root` |
| `/{identifier}`            |  `GET`   | Busca detalhes de um usuário por ID, E-mail ou Username.       | `admin`, `root` |
| `/{identifier}`            | `PATCH`  | Atualiza dados e cargos de terceiros (respeitando hierarquia). | `admin`, `root` |
| `/{identifier}`            | `DELETE` | Remove permanentemente um usuário do banco de dados.           |  `root` apenas  |
| `/{identifier}/deactivate` | `PATCH`  | Desativa administrativamente a conta de um terceiro.           | `admin`, `root` |

---

### 💻 4. Equipamentos (`/api/v1/equipamentos`)

Gestão de inventário e máquinas. Requer autenticação.

| Rota    |  Método  | Descrição                                              |    Restrição    |
| :------ | :------: | :----------------------------------------------------- | :-------------: |
| `/`     |  `GET`   | Lista equipamentos com paginação, filtros e ordenação. |     Logado      |
| `/`     |  `POST`  | Cadastra um novo equipamento no sistema.               |     Logado      |
| `/{id}` |  `GET`   | Busca os dados completos de um equipamento específico. |     Logado      |
| `/{id}` | `PATCH`  | Atualiza as informações operacionais do equipamento.   |     Logado      |
| `/{id}` | `DELETE` | Remove um equipamento do sistema.                      | `admin`, `root` |

---

### 🔧 5. Manutenções (`/api/v1/manutencoes`)

Gestão de ordens de serviço utilizando padrão Master-Detail. Requer autenticação.

| Rota              |  Método  | Descrição                                                |    Restrição    |
| :---------------- | :------: | :------------------------------------------------------- | :-------------: |
| `/`               |  `GET`   | Lista as capas das manutenções (sem os itens aninhados). |     Logado      |
| `/`               |  `POST`  | Cria uma manutenção (permite envio de itens no array).   |     Logado      |
| `/{id}`           |  `GET`   | Busca a capa detalhada de uma manutenção específica.     |     Logado      |
| `/{id}`           | `PATCH`  | Atualiza as informações da capa da manutenção.           |     Logado      |
| `/{id}`           | `DELETE` | Remove a manutenção e seus itens em cascata.             | `admin`, `root` |
| `/{id}/itens`     |  `GET`   | Lista de forma paginada os itens/serviços da manutenção. |     Logado      |
| `/{id}/itens`     |  `POST`  | Adiciona um item avulso a uma manutenção existente.      |     Logado      |
| `/itens/{itemId}` | `DELETE` | Remove um item/serviço específico.                       | `admin`, `root` |

---

### 🏢 6. Tabelas Auxiliares (`/api/v1/...`)

Gestão das entidades de apoio (Prédios, Locais, Fornecedores, etc). Todas exigem usuário logado para leitura, criação e edição.

| Rota Base       |       Métodos Disponíveis        | Descrição Principal                         | Exclusão (DELETE) |
| :-------------- | :------------------------------: | :------------------------------------------ | :---------------: |
| `/predios`      | `GET`, `POST`, `PATCH`, `DELETE` | Gestão de edifícios institucionais.         |  `admin`, `root`  |
| `/locais`       | `GET`, `POST`, `PATCH`, `DELETE` | Setores e salas atrelados a um prédio.      |  `admin`, `root`  |
| `/grupos`       | `GET`, `POST`, `PATCH`, `DELETE` | Agrupamentos macro de categorias.           |  `admin`, `root`  |
| `/categorias`   | `GET`, `POST`, `PATCH`, `DELETE` | Classificações específicas de equipamentos. |  `admin`, `root`  |
| `/marcas`       | `GET`, `POST`, `PATCH`, `DELETE` | Fabricantes das máquinas e ativos.          |  `admin`, `root`  |
| `/fornecedores` | `GET`, `POST`, `PATCH`, `DELETE` | Empresas prestadoras de serviços (CNPJ).    |  `admin`, `root`  |

---

_Projeto desenvolvido para fins acadêmicos - UNIVESP._
