# ADR 0003: Desenvolvimento Contract-First com Zod em Monorepo Compartilhado

- **Status**: Aceito
- **Data**: 2026-09-09
- **Decisores**: Equipe de Desenvolvimento ADS-PI-II

---

## 1. Contexto do Problema

Em aplicações distribuídas com clientes móveis e APIs backend desacopladas, o desalinhamento de contratos de dados é uma das principais fontes de bugs em tempo de execução:
- Tipos TypeScript duplicados manualmente em múltiplos repositórios ou pastas tornam-se dessincronizados com facilidade.
- A validação puramente em tempo de compilação do TypeScript não protege o backend contra entradas maliciosas ou formatos inesperados enviados pela rede em tempo de execução.
- No aplicativo mobile, validar regras de negócio em formulários com código imperativo gera inconsistência com as regras impostas pelo servidor.

---

## 2. Decisão Arquitetural

Adotamos a abordagem **Contract-First** centralizada no pacote **`packages/contracts`** (`@menu-digital/contracts`):

1. **Fonte Única da Verdade com Zod**:
   - Todo esquema de entrada e saída (autenticação, registro, restaurantes, cardápios, pedidos) é definido exclusivamente como schema Zod em `packages/contracts/src/schemas/`.
   - Os tipos TypeScript estáticos correspondentes são inferidos automaticamente utilizando `z.infer<typeof Schema>`, eliminando a necessidade de manter interfaces separadas manualmente.
2. **Validação na Borda do Backend (`apps/api`)**:
   - Middlewares Express genéricos (`validateBody`, `validateQuery`) executam `.safeParse()` nas requisições HTTP.
   - Requisições inválidas são imediatamente rejeitadas com HTTP 400 e relatório estruturado de erros de validação antes de atingirem controllers ou regras de negócio.
3. **Validação de Formulários no Mobile (`apps/mobile`)**:
   - Os schemas de contrato são consumidos diretamente pelo `react-hook-form` via `@hookform/resolvers/zod`.
   - Assegura feedback instantâneo de erros nos campos de entrada sem divergência em relação às validações do servidor.
4. **Ciclo de Compilação do Monorepo**:
   - O pacote compila com `npm run build -w packages/contracts` gerando declarações `.d.ts` e arquivos distribuídos consumidos pelos workspaces `apps/*`.

---

## 3. Consequências e Trade-offs

### Pontos Positivos
- **Segurança de Tipos Ponta a Ponta (End-to-End Type Safety)**: Qualquer alteração no schema que quebre o cliente ou a API é detectada imediatamente pelo linter/compilador (`npm run lint:api` e `npm run lint:mobile`).
- **Eliminação de Código Duplicado**: Reduz o volume de código de validação redundante e mantém a linguagem ubíqua consistente.
- **Auditoria Facilitada**: Novos endpoints e atributos precisam necessariamente passar pela revisão do contrato primeiro.

### Pontos de Atenção
- Requer execução de `npm run build -w packages/contracts` após cada alteração de schema antes de testar os workspaces dependentes.
