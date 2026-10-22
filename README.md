# 🏆 Arena Quiz Gamificado

Plataforma interativa de Quiz estilo Kahoot em tempo real com avatares de guerreiros, sistema de pontuação e ranking global integrado ao **Supabase**, sincronização multi-dispositivo via **WebSockets** e design moderno.

---

## 🚀 Tecnologias

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti, Motion
- **Backend**: Node.js, Express, WebSockets (`ws`)
- **Banco de Dados**: Supabase (PostgreSQL com RLS, views e triggers)
- **Hospedagem Recomendada**: Render (Serviço Fullstack com WebSockets) ou Vercel + Render

---

## 📁 Estrutura do Projeto

```text
├── public/avatars/          # Avatares personalizados de guerreiros
├── src/
│   ├── components/          # Componentes visuais (Leaderboard, Modal, Podio, etc.)
│   ├── lib/supabase.ts      # Conexão com Supabase e APIs
│   ├── types.ts             # Modelos de dados TypeScript
│   └── App.tsx              # Aplicação principal
├── server.ts                # Servidor Node/Express com WebSockets & API REST
├── supabase_schema.sql      # Script SQL completo para criação das tabelas no Supabase
├── render.yaml              # Configuração Blueprint para Deploy no Render
├── vercel.json              # Configuração SPA para Deploy na Vercel
└── .env.example             # Modelo das variáveis de ambiente
```

---

## 💻 Executando Localmente

1. Clone o repositório ou acesse a pasta do projeto:
   ```bash
   npm install
   ```

2. Configure seu arquivo `.env`:
   Copie `.env.example` para `.env` e preencha suas chaves do Supabase.

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:3000`

---

## ☁️ Guia de Deploy nas Nuvens

### 1. Supabase (Banco de Dados & Ranking)
1. Crie uma conta ou acesse [Supabase](https://supabase.com).
2. Crie um novo projeto (ex: `arena-quiz-gamificado`).
3. Vá em **SQL Editor** no painel do Supabase.
4. Abra o arquivo `supabase_schema.sql` deste projeto, copie todo o conteúdo e execute (**Run**).
5. Em **Project Settings > API**, copie a **Project URL** e as chaves **anon** e **service_role/secret**.

---

### 2. GitHub (`arrepio13-droid`)
1. Crie um repositório chamado `arena-quiz-gamificado` no seu GitHub: [https://github.com/new](https://github.com/new).
2. No terminal do projeto, execute:
   ```bash
   git init
   git config user.name "arrepio13-droid"
   git add .
   git commit -m "feat: lancamento arena quiz gamificado com supabase e websocket"
   git branch -M main
   git remote add origin https://github.com/arrepio13-droid/arena-quiz-gamificado.git
   git push -u origin main
   ```

---

### 3. Deploy no Render (Recomendado para Fullstack + WebSockets)
O **Render** suporta conexões persistentes de WebSockets e roda o servidor Node.js com o frontend juntos.

1. Acesse [render.com](https://render.com) e conecte com seu GitHub.
2. Clique em **New +** > **Web Service**.
3. Selecione o repositório `arrepio13-droid/arena-quiz-gamificado`.
4. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Em **Environment Variables**, adicione:
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: sua URL do Supabase (ex: `https://xxxx.supabase.co`)
   - `SUPABASE_SECRET_KEY`: sua chave de serviço ou anon
   - `VITE_SUPABASE_URL`: sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY`: sua chave anon
6. Clique em **Deploy Web Service**!

---

### 4. Deploy no Vercel (Opcional - Frontend Estático)
Se desejar que o Frontend fique na Vercel:
1. Acesse [vercel.com](https://vercel.com) e importe o repositório `arrepio13-droid/arena-quiz-gamificado`.
2. Em **Environment Variables**, configure:
   - `VITE_SUPABASE_URL`: sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY`: sua chave anon
   - `VITE_API_URL`: a URL do seu backend no Render (ex: `https://arena-quiz-gamificado.onrender.com`)
   - `VITE_WS_URL`: a URL WebSocket do Render (ex: `wss://arena-quiz-gamificado.onrender.com`)
3. Clique em **Deploy**. O arquivo `vercel.json` cuidará de rotear as requisições SPA corretamente.
