# 🚀 Painel Administrativo - Front-End

Front-end desenvolvido para o sistema de gestão de equipamentos, manutenções e utilizadores (PI II - UNIVESP). A interface foi construída seguindo padrões modernos de experiência do utilizador (UI/UX), oferecendo navegação fluida, controle hierárquico de permissões e integração completa com a API RESTful do back-end.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias e bibliotecas:

- **[React 18](https://react.dev/)** - Biblioteca JavaScript para construção de interfaces de utilizador baseadas em componentes.
- **[Vite](https://vitejs.dev/)** - Ferramenta de build frontend rápida e moderna.
- **[React Router DOM](https://reactrouter.com/)** - Gerenciamento de rotas e navegação protegida.
- **[TanStack React Query](https://tanstack.com/query)** - Gerenciamento de estado assíncrono, cache inteligente e sincronização de dados com a API.
- **CSS Nativo / Variáveis Globais** - Estilização customizada focada em design limpo, componentes modulares (`panel`, `badge`, `table`, `toolbar`, etc.) e suporte a responsividade.

---

## ✨ Funcionalidades Principais

- **Autenticação & Sessão**: Login seguro, proteção de rotas privadas e configuração inicial (Setup Root) para primeiro acesso.
- **Gestão de Utilizadores (`/usuarios`)**:
  - Listagem paginada (10 itens por padrão) com suporte a filtros dinâmicos por cargo (`role`) e status (`status`), além de barra de pesquisa integrada.
  - Hierarquia de permissões (`root` gerencia todos; `admin` gerencia utilizadores básicos).
  - Modal de edição avançada permitindo alterar dados cadastrais, cargo e status do utilizador de forma dinâmica.
- **Gestão de Perfil (`/perfil`)**:
  - Edição de dados pessoais e alteração de palavra-passe.
  - Aba de verificação de e-mail via código OTP e fluxo de desativação segura da própria conta exigindo a palavra-passe atual.
- **Sistema de Notificações (Toasts)**: Feedback visual imediato para todas as operações bem-sucedidas ou rejeitadas pelo servidor.

---

## ⚙️ Como Executar o Projeto

1. Certifique-se de que o **back-end** está a correr localmente (geralmente na porta `3000`).
2. Na pasta do front-end, instale as dependências:
   ```bash
   npm install
   ```
3. Crie um ficheiro `.env` na raiz do front-end configurando a URL da API:
   ```Snippet de código
   VITE_API_URL=http://localhost:3000/api/v1
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
