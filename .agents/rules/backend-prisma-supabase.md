# Regras de Backend (Express 5, Prisma ORM & Supabase)

Este documento estabelece as diretrizes de código e segurança para a API em `apps/api`.

## 1. Stack e Ferramentas

- **Node.js**: >= 22
- **Framework HTTP**: Express 5.2.1
- **Linguagem**: TypeScript ~5.9.2
- **ORM**: Prisma 6.19.1
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth (`@supabase/supabase-js`)
- **Validação de Payload**: Zod 3.24.2 + `@menu-digital/contracts`
- **Executor / Dev**: `tsx watch`

## 2. Arquitetura de Autenticação e Prevenção do Dual-Write Problem

Para garantir integridade absoluta entre o Supabase Auth e a tabela relacional `users` no Prisma:

1. **Criação do Usuário**:
   - Chamar `supabase.auth.signUp()` usando o cliente público (`SUPABASE_ANON_KEY`).
2. **Criação do Perfil no Prisma**:
   - Em seguida, persistir o registro em `prisma.user.create()` vinculando o `id` (UUID) do Supabase Auth.
3. **Transação Compensatória Obrigatória**:
   - Caso `prisma.user.create()` lance exceção, **obrigatoriamente** acionar `supabaseAdmin.auth.admin.deleteUser(id)` usando o cliente administrativo (`SUPABASE_SERVICE_ROLE_KEY`) para excluir o usuário órfão.
   - Retornar status HTTP 500 com mensagem apropriada.

## 3. Isolamento de Privilégios do Supabase

- **Cliente Público (`supabase`)**:
  - Utiliza `SUPABASE_ANON_KEY`.
  - Usado para login, registro inicial e verificação de token de usuário comum.
- **Cliente Administrativo (`supabaseAdmin`)**:
  - Utiliza `SUPABASE_SERVICE_ROLE_KEY`.
  - Usado **apenas** no backend para operações privilegiadas (como exclusão de usuários na transação compensatória).
  - **PROIBIDO** expor este cliente ou sua chave em rotas públicas ou trafegá-lo para o mobile.

## 4. Prisma e Banco de Dados

- **Migrations**:
  - Em desenvolvimento: `npm run prisma:migrate -w apps/api` (`prisma migrate dev`).
  - Em produção/deploy: `npm run prisma:migrate:deploy -w apps/api` (`prisma migrate deploy`).
- **Geração de Tipos**:
  - Sempre executar `npm run prisma:generate -w apps/api` após alterar `schema.prisma`.
- **Validação de Parâmetros**:
  - Respeitar estritamente a documentação oficial do Prisma Client e do driver de conexão PostgreSQL.
  - Nunca alucinar opções inexistentes na connection string do PostgreSQL.

## 5. Middleware e Proteção de Rotas

- Toda rota privada deve passar pelo `authMiddleware`, que extrai o Bearer token dos headers, valida junto ao Supabase via `supabase.auth.getUser(token)` e anexa os dados do usuário autenticado na requisição.
- Retornar sempre códigos HTTP semânticos (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error).
