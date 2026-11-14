# Sistema Web de Gerenciamento de Tickets (Helpdesk)

Sistema web completo, funcional e objetivo para gestão de tickets de suporte técnico (Helpdesk), desenvolvido em arquitetura monorepo com separação clara entre **Frontend** e **Backend**.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:**
  - React (JavaScript puro, sem TypeScript)
  - Vite
  - React Router DOM v6
  - Axios (com interceptor de autenticação)
  - Tailwind CSS & Lucide React para interface moderna e responsiva
- **Backend:**
  - Node.js + Express
  - Banco de Dados SQLite (`better-sqlite3` com fallback automático e transparente para driver nativo `node:sqlite`)
  - Criptografia de senhas com `bcryptjs`
  - Validação estrita de esquemas com `zod`
  - Controle de sessões baseado em hash SHA-256 no banco com expiração de 8h
  - Notificações em tempo real via polling (30s)

---

## 👥 Perfis de Acesso e Regras de Negócio

### 1. Administrador (`admin`)
- Acesso irrestrito a todos os tickets e módulos.
- **CRUD de Usuários:** criação, atribuição de perfil (`admin`, `tecnico`, `usuario`), ativação/desativação (com revogação imediata de sessões) e redefinição de senhas.
- **Solicitações de Troca de Senha:** lista de solicitações pendentes originadas da tela de login com opção de resetar a senha e marcar como resolvida.
- **Relatório de Acompanhamento:** cards de indicadores, tempo médio de atendimento, gráficos/barras de distribuição por status e prioridade, e tabela de produtividade por técnico com filtro por período.
- **Controle Total de Tickets:** alteração para qualquer status (inclusive retroceder), permissão de comentar em chamados fechados e exclusão lógica de chamados (`deleted_at`).

### 2. Técnico (`tecnico`)
- Visualiza apenas:
  - **Novos Tickets:** chamados sem técnico atribuído (`tecnico_id IS NULL`).
  - **Meus Tickets:** chamados sob sua responsabilidade (`tecnico_id = seu id`).
- **Operação Atômica de Assumir:** assume chamados disponíveis atomicamente no banco; em caso de concorrência simultânea, a API retorna `409 Conflict`. Ao assumir, o status transiciona automaticamente para **"Em andamento"**.
- **Avanço de Status:** avança o status estritamente no fluxo `Aberto` → `Em andamento` → `Resolvido` ("Confirmar solução/conclusão" registra a data `concluido_em`). Não fecha chamados nem retrocede status.
- **Comentários:** só pode comentar em chamados que já assumiu sob sua responsabilidade. Bloqueado em chamados fechados.

### 3. Usuário Solicitante (`usuario`)
- Criação de novos chamados com título, descrição e prioridade (`baixa`, `media`, `alta`).
- Visualiza e comenta apenas nos seus próprios chamados.
- **Fechamento e Reabertura:** quando o chamado estiver com status **"Resolvido"**, o usuário pode:
  - **Confirmar Encerramento:** move o status para **"Fechado"**.
  - **Reabrir Chamado:** move o status para **"Em andamento"** mantendo o técnico, limpando `concluido_em` e exigindo obrigatoriamente um comentário com o motivo da reabertura.
- Usuários não podem alterar a própria senha nem editar/excluir tickets.

---

## 🔐 Autenticação e Segurança

- Sessões com tokens aleatórios de 256 bits, armazenados em formato hash SHA-256 na tabela `sessions`, com expiração de 8 horas.
- Ao realizar logout ou ao ser desativado pelo administrador, o token tem `revoked = 1`.
- A rota pública de recuperação de senha responde de forma genérica para evitar enumeração de usuários.
- Middlewares no backend garantem autorização em nível de API (`401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`).

---

## 📦 Credenciais Iniciais de Demonstração (Seed)

O banco de dados SQLite é inicializado e populado automaticamente na primeira execução:

| Perfil | Login | Senha | Descrição |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Administrador geral do sistema |
| **Técnico** | `tecnico` | `tecnico123` | Técnico para atendimento e resolução |
| **Usuário** | `usuario` | `usuario123` | Solicitante para criação e homologação |

*A tela de login conta ainda com botões de atalho rápido para preencher as credenciais de teste com 1 clique.*

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- Node.js instalado (versão 18, 20, 22 ou 24)
- npm instalado

---

### Opção A: Execução em pastas separadas (Recomendado)

#### 1. Iniciar o Backend
Abra um terminal na pasta raiz do projeto:
```bash
cd backend
npm install
npm run dev
```
O servidor backend iniciará em **`http://localhost:3001`**. O banco `ticket.db` será criado e semeado automaticamente.

#### 2. Iniciar o Frontend
Abra um segundo terminal na pasta raiz do projeto:
```bash
cd frontend
npm install
npm run dev
```
A aplicação web iniciará em **`http://localhost:5173`**.

---

### Opção B: Execução através do Monorepo Root

No terminal raiz do projeto:
```bash
# Instala dependências de ambos os projetos
npm run install:all

# Em terminais separados:
npm run dev:backend
npm run dev:frontend
```

---

## 🧪 Testes Automatizados da API

Um script de testes automatizados completo está disponível para validar todas as regras de negócio, concorrência, status e permissões da API:

```bash
# Com o backend em execução:
node backend/test_api.js
```

Cenários cobertos pelo teste:
1. Login dos três perfis (Admin, Técnico, Usuário)
2. Criação de chamado pelo usuário solicitante
3. Notificação automática para os técnicos ativos
4. Operação atômica de assumir ticket e transição para "Em andamento"
5. Validação de conflito de concorrência (`409 Conflict`)
6. Troca de comentários entre técnico e usuário
7. Notificações disparadas sem envio para o próprio autor da ação
8. Conclusão/resolução de chamado pelo técnico (`Resolvido` com `concluido_em`)
9. Encerramento de chamado pelo solicitante (`Fechado`)
10. Bloqueio de comentários em chamados fechados (`403 Forbidden`)
11. Exceção do Admin para comentar em chamado fechado
12. Reabertura pelo usuário exigindo motivo obrigatório (`422` se omitido)
13. Registro de solicitação de recuperação de senha com resposta genérica
14. Consulta de solicitações e relatórios gerenciais pelo Admin
15. Exclusão lógica (`deleted_at`) pelo Admin e ocultação em todas as consultas

---

## 📂 Estrutura de Diretórios

```
Ticket/
├── backend/
│   ├── src/
│   │   ├── config.js
│   │   ├── server.js
│   │   ├── db/
│   │   │   ├── connection.js       # Conexão e adapter SQLite
│   │   │   ├── schema.js           # Tabelas, chaves e índices
│   │   │   └── seed.js             # Criação dos usuários padrão
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── ticketController.js
│   │   │   ├── commentController.js
│   │   │   ├── userController.js
│   │   │   ├── reportController.js
│   │   │   └── notificationController.js
│   │   ├── middlewares/
│   │   │   ├── auth.js             # Autenticação por token e verificação de perfil
│   │   │   └── validate.js         # Validação de schema com Zod
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── ticketRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   └── notificationRoutes.js
│   │   └── services/
│   │       └── notificationService.js
│   ├── test_api.js                 # Suíte de testes automatizados
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Configuração de rotas protegidas
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Estado de autenticação e polling de notificações
│   │   ├── services/
│   │   │   └── api.js              # Cliente Axios com interceptors
│   │   ├── components/
│   │   │   ├── Layout.jsx          # Sidebar + Header com sino de notificações
│   │   │   ├── ProtectedRoute.jsx  # Guarda de rotas por perfil
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── PriorityBadge.jsx
│   │   │   └── Modal.jsx
│   │   └── pages/
│   │       ├── Login.jsx           # Login + modal de recuperação + botões demo
│   │       ├── TicketList.jsx      # Lista de chamados e "Novos Tickets" para assumir
│   │       ├── TicketDetail.jsx    # Detalhe, transições de status e comentários
│   │       ├── NewTicket.jsx       # Formulário de abertura de chamados
│   │       ├── Reports.jsx         # Indicadores, gráficos e filtros por período
│   │       └── Users.jsx           # Gestão de usuários e solicitações de senha
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json                    # Scripts raiz do monorepo
└── README.md
```
