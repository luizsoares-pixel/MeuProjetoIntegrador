# API Backend - Menu Digital

Backend Express + TypeScript + Prisma + Supabase Auth para o projeto Menu Digital.

## Arquitetura de Autenticação

A autenticação é integrada entre o **Supabase Auth** e o banco de dados relacional gerenciado via **Prisma ORM**.

### Prevenção do Dual Write Problem

Para evitar inconsistências (usuários criados no Supabase Auth sem o perfil correspondente na tabela `users` do banco relacional):
1. O usuário é criado no Supabase Auth via `supabase.auth.signUp()`.
2. Em seguida, o perfil é criado no banco de dados via `prisma.user.create()`.
3. Se a criação no Prisma falhar, uma **transação compensatória** imediata invoca `supabaseAdmin.auth.admin.deleteUser(id)` usando o cliente administrativo (`SUPABASE_SERVICE_ROLE_KEY`) para apagar o registro órfão no Auth e retorna erro 500.

### Isolamento de Privilégios do Supabase

- **`supabase` (Cliente Público)**: Utiliza a `SUPABASE_ANON_KEY` para fluxos padrão (`signUp`, `signInWithPassword`, `getUser`).
- **`supabaseAdmin` (Cliente Admin)**: Utiliza a `SUPABASE_SERVICE_ROLE_KEY` exclusivamente para operações privilegiadas (como deletar usuários na transação compensatória).

## Rotas de Autenticação

| Método | Endpoint | Proteção | Descrição |
|---|---|---|---|
| `POST` | `/auth/register` | Pública (Validação Zod) | Cadastra usuário no Supabase Auth e insere perfil no Prisma com transação compensatória em caso de falha. |
| `POST` | `/auth/login` | Pública (Validação Zod) | Autentica com e-mail/senha e retorna tokens de sessão junto com dados do perfil do Prisma. |
| `GET` | `/auth/me` | Privada (`authMiddleware`) | Retorna os dados do perfil do usuário autenticado no Prisma após validar o Bearer Token no Supabase Auth (`getUser`). |

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz de `apps/api` baseado em `.env.example`:

```env
PORT=3333
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-admin-key
```

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor em modo de desenvolvimento com hot reload (`tsx watch`).
- `npm run build`: Compila o TypeScript para a pasta `dist`.
- `npm run lint`: Executa a verificação estática de tipos e código.
- `npm run prisma:generate`: Gera os tipos do Prisma Client.
- `npm run prisma:migrate`: Executa as migrações do banco de dados em desenvolvimento.
