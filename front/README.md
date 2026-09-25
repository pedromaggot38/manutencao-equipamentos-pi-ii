# 🚀 Painel Administrativo - Front-End

Front-end desenvolvido para o sistema de gestão de equipamentos, manutenções e utilizadores (PI II - UNIVESP). A interface foi construída seguindo padrões modernos de experiência do utilizador (UI/UX), oferecendo navegação fluida, controle hierárquico de permissões e integração completa com a API RESTful do back-end.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias e bibliotecas:

- **[React 18](https://react.dev/)** - Biblioteca JavaScript para construção de interfaces de usuário baseadas em componentes.
- **[Vite](https://vitejs.dev/)** - Ferramenta de build frontend rápida e moderna.
- **[React Router DOM](https://reactrouter.com/)** - Gerenciamento de rotas e navegação protegida.
- **[TanStack React Query](https://tanstack.com/query)** - Gerenciamento de estado assíncrono, cache inteligente e sincronização de dados com a API.
- **CSS Nativo / Variáveis Globais** - Estilização customizada focada em design limpo, componentes modulares (`panel`, `badge`, `table`, `toolbar`, etc.) e suporte a responsividade.

---

## ✨ Funcionalidades Principais

- **Autenticação & Sessão**: Login seguro, proteção de rotas privadas e configuração inicial (Setup Root) para primeiro acesso[cite: 1, 2].
- **Gestão de Usuários (`/usuarios`)**:
  - Listagem paginada (10 itens por padrão) com suporte a filtros dinâmicos por cargo (`role`) e status (`status`), além de barra de pesquisa integrada[cite: 1, 2].
  - Hierarquia de permissões (`root` gerencia todos; `admin` gerencia usuários básicos)[cite: 1, 2].
  - Modal de edição avançada permitindo alterar dados cadastrais, cargo e status do usuário de forma dinâmica[cite: 1, 2].
  - Criação de novos usuários com controle de permissões por perfil (apenas administradores e root) e validação de confirmação de senha.
- **Gestão de Equipamentos (`/equipamentos`)**:
  - Listagem paginada com paginação configurável e pesquisa textual por patrimônio, tipo ou modelo[cite: 1, 2].
  - Filtros combinados por situação (ativo, em manutenção, inativo, baixado), categoria, prédio, marca e opções avançadas de ordenação[cite: 1, 2].
  - Cadastro e edição completa de equipamentos via modal com carregamento otimizado de entidades auxiliares em cache[cite: 1, 2].
  - Exclusão segura de itens com restrição de privilégios (`admin` e `root`)[cite: 1, 2].
- **Gestão de Manutenções (`/manutencoes`)**:
  - Listagem geral de ordens de serviço com pesquisa por texto e filtros por intervalo de datas (`data_inicio` e `data_fim`)[cite: 1, 2].
  - Cadastro de nova manutenção com suporte à inserção dinâmica de múltiplos itens e serviços no mesmo fluxo[cite: 1, 2].
  - Página dedicada de detalhes e gestão Master-Detail (`/manutencoes/:id`) para acompanhamento da ordem.
  - Edição dos dados da capa da manutenção (nota fiscal, data, solicitação, fornecedor, tipo e status de finalização).
  - Gestão individual dos itens da ordem (adicionar, editar valores/quantidades e excluir com diálogo de confirmação).
  - Exibição de totais financeiros calculados em tempo real com indicador visual destacado.
- **Cadastros Auxiliares (CRUD Genérico via `CrudPage`)**:
  - Telas padronizadas para gestão de tabelas de apoio: Categorias, Marcas, Prédios, Locais e Fornecedores[cite: 1, 2].
  - Operações completas de listagem paginada, busca, criação, edição e remoção para cada entidade auxiliar[cite: 1, 2].
- **Painel de Indicadores (`/dashboard`)**:
  - Visão consolidada de métricas operacionais, contagem de equipamentos por situação e resumo de custos de manutenção[cite: 1, 2].
- **Gestão de Perfil (`/perfil`)**:
  - Edição de dados pessoais e alteração de palavra-passe[cite: 1, 2].
  - Aba de verificação de e-mail via código OTP e fluxo de desativação segura da própria conta exigindo a palavra-passe atual[cite: 1, 2].
- **Sistema de Notificações (Toasts)**: Feedback visual imediato para todas as operações bem-sucedidas ou rejeitadas pelo servidor[cite: 1, 2].
- **Acessibilidade**: Integração com widget oficial do VLibras para tradução e interpretação em Língua Brasileira de Sinais[cite: 1, 2].

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
