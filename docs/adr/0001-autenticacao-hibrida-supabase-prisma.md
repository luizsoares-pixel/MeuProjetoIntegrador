# ADR 0001: Autenticação Híbrida Supabase Auth e Prisma com Transação Compensatória

- **Status**: Aceito
- **Data**: 2026-09-09
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II

---

## 1. Contexto do Problema

O projeto **Menu-Digital** necessita de um sistema seguro de autenticação e gerenciamento de sessões para clientes em dispositivos móveis (React Native/Expo) e para a API backend (Express 5).

A persistência dos dados relacionais do negócio (como restaurantes, pedidos e dados complementares de usuários) é gerenciada via **Prisma ORM** conectado ao banco de dados PostgreSQL. Por outro lado, o gerenciamento de credenciais seguras, tokens JWT, criptografia de senhas e recuperação de acesso é suprido pelo serviço gerenciado **Supabase Auth**.

Ao manter o usuário no Supabase Auth e o perfil de usuário na tabela relacional `users` do Prisma, surge o **Dual-Write Problem**: uma falha na escrita do banco relacional após o cadastro no Supabase Auth deixaria um usuário órfão e impossibilitado de ser cadastrado novamente com o mesmo e-mail.

---

## 2. Decisão Arquitetural

Adotamos a estratégia de **Autenticação Híbrida com Transação Compensatória**:

1. **Cadastro em Duas Etapas**:
   - Primeiro, o endpoint `POST /auth/register` cria o usuário no Supabase Auth usando o cliente público (`supabase.auth.signUp()`).
   - Em seguida, cria o registro correspondente na tabela `users` do Prisma usando o mesmo `id` UUID gerado pelo Supabase.
2. **Transação Compensatória**:
   - Caso a operação no Prisma falhe por qualquer razão (ex: violação de constraint, queda momentânea do banco), o bloco `catch` aciona imediatamente o cliente administrativo `supabaseAdmin.auth.admin.deleteUser(id)` autenticado com a `SUPABASE_SERVICE_ROLE_KEY`.
   - O registro órfão é excluído e o backend responde com HTTP 500 informando o erro de persistência.
3. **Isolamento Estrito de Chaves**:
   - A `SUPABASE_SERVICE_ROLE_KEY` permanece **exclusivamente** no ambiente backend (`apps/api/.env`), nunca sendo compartilhada com o aplicativo mobile.
   - O aplicativo móvel utiliza exclusivamente a `SUPABASE_ANON_KEY` para sessões do cliente.

---

## 3. Consequências e Trade-offs

### Pontos Positivos
- **Consistência de Dados**: Elimina o risco de contas fantasmas bloqueadas por falhas na persistência relacional.
- **Segurança**: Delega o armazenamento de hashes de senhas e geração de tokens JWT ao Supabase, mantendo a tabela local limpa e em conformidade com as melhores práticas de proteção de dados.
- **Relacionamentos Transparentes**: O UUID do Supabase Auth é a chave primária direta do modelo `User` no Prisma, facilitando joins nativos com tabelas de pedidos, favoritos e avaliações.

### Pontos de Atenção
- Requer tratamento cuidadoso caso a própria chamada de exclusão compensatória falhe na rede (mitigado por logs estruturados e monitoramento).
