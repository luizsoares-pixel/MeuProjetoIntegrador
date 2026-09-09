# Guia de Engenharia e Desenvolvimento com Agentes de IA

Bem-vindo ao guia oficial de colaboração assistida por Inteligência Artificial do projeto **Menu-Digital** (CEUB ADS - Projeto Integrador II).

Este documento orienta os desenvolvedores da equipe sobre como utilizar o **Antigravity CLI** de forma profissional, padronizada e segura, garantindo que o uso de agentes de IA aumente a produtividade sem comprometer a qualidade do código, a segurança das credenciais ou os critérios de avaliação acadêmica.

---

## 1. Filosofia: Por que Agentes com Engenharia Disciplinada?

No desenvolvimento de software moderno, a IA não deve ser utilizada como um gerador aleatório de código ("vibe coding"). Sem governança, agentes podem introduzir bugs sutis, alucinar bibliotecas ou criar inconsistências graves em banco de dados e contratos de API.

Neste repositório, adotamos uma abordagem de **Engenharia de Software Aumentada por Agentes**, combinando as melhores práticas da indústria para orquestrar as tarefas de forma previsível e auditável:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. ALINHAR          2. PLANEJAR            3. IMPLEMENTAR      4. AUDITAR   │
│   (Grill-Me)       (Spec & Tasks)           (Red/Green TDD)     (Verify & PR)│
│                                                                             │
│ Entrevista sobre   Plano atômico antes     Subagentes focados   Testes auto,│
│ regras e termos    de qualquer código       com testes unitários linter e DoD│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. A Tríade de Referência (Créditos Open-Source)

Nossa infraestrutura agentica integra conceitos e técnicas consagradas de três projetos abertos de referência mundial:

### 🦸 [obra/superpowers](https://github.com/obra/superpowers) — O Motor Metodológico
* **Autor**: Jesse Vincent (obra).
* **Papel no projeto**: Atua como o motor central de processos e governança. Garante que o agente **planeje antes de codificar**, divida histórias em tarefas atômicas, adote o ciclo de **TDD estrito** (Red $\to$ Green $\to$ Refactor) e delegue tarefas complexas a subagentes de contexto isolado.
* **Instalação**: Integrado nativamente ao CLI do Antigravity via plugin (`agy plugin install https://github.com/obra/superpowers`).

### 🎯 [mattpocock/skills](https://github.com/mattpocock/skills) — Alinhamento de Domínio e ADRs
* **Autor**: Matt Pocock (fundador do *Total TypeScript*, ex-Vercel).
* **Papel no projeto**: Fornece o fluxo de alinhamento por entrevista (`grill-with-docs`), assegurando que a equipe e a IA falem a mesma **Linguagem Ubíqua** através do [CONTEXT.md](../CONTEXT.md) e formalizem todas as decisões arquiteturais relevantes em **ADRs** ([docs/adr/](adr/)).

### 🛡️ [affaan-m/ECC](https://github.com/affaan-m/ECC) — Conhecimento Técnico da Stack e Segurança
* **Autor**: Affaan Mustafa.
* **Papel no projeto**: Fonte das regras técnicas especializadas para a nossa stack monorepo (Expo SDK 54, React Native 0.81, Express 5, Prisma ORM 6.19 e Zod Contracts) e das práticas de auditoria do **AgentShield** (proteção contra vazamento de variáveis de ambiente sensíveis e injeções).

---

## 3. Guia de Onboarding para Desenvolvedores da Equipe

Se você é um desenvolvedor do grupo e quer rodar o Antigravity CLI na sua máquina:

### Passo 1: Ter o Antigravity CLI Instalado
Verifique se você possui o executável `agy` configurado no seu terminal:
```bash
agy --version
```

### Passo 2: Importar o Plugin Superpowers
Na raiz do projeto clonado, registre o plugin oficial do Superpowers:
```bash
agy plugin install https://github.com/obra/superpowers
```

### Passo 3: Conferir a Ativação dos Recursos
Execute o comando abaixo para confirmar que os plugins estão ativos:
```bash
agy plugin list
```
O Antigravity detectará automaticamente todos os arquivos da pasta local [`.agents/`](../.agents/) e o arquivo mestre [AGENTS.md](../AGENTS.md).

---

## 4. O Fluxo de Trabalho em 4 Etapas

Ao solicitar qualquer nova funcionalidade ou correção para o agente:

### Etapa 1: Alinhamento de Requisitos (Grilling)
O agente ativará a skill `grill-with-docs`. Em vez de tentar adivinhar, ele fará perguntas pontuais sobre:
* Regras de negócio e casos de borda (ex: erro de rede, permissão de GPS negada).
* Entidades afetadas ([CONTEXT.md](../CONTEXT.md)).
* Mudanças nos contratos de API (`packages/contracts`).

### Etapa 2: Plano de Implementação
O agente estruturará um plano detalhado contendo:
* Arquivos que serão criados (`[NEW]`), modificados (`[MODIFY]`) ou removidos (`[DELETE]`).
* Divisão por workspaces (`packages/contracts`, `apps/api`, `apps/mobile`).
* Plano de testes unitários e critérios de verificação.
* *Aguardará a sua aprovação explícita antes de gerar código.*

### Etapa 3: Execução Incremental e TDD
Com a aprovação, o agente aplicará o ciclo Red/Green TDD:
* Criação de testes que falham inicialmente.
* Implementação do código mínimo necessário para os testes passarem.
* Refatoração preservando a integridade das tipagens estritas do TypeScript.

### Etapa 4: Auditoria e Verificação (DoD)
Antes de considerar o trabalho concluído, a skill `verify-monorepo` deve ser executada:
```bash
npm run build -w packages/contracts
npm run lint -w apps/api
npm run test -w apps/api
npm run lint -w apps/mobile
```

---

## 5. Catálogo de Subagentes Especializados

Você pode solicitar que o Antigravity delegue tarefas para agentes especializados definidos em [`.agents/agents/`](../.agents/agents/):

| Subagente | Arquivo de Definição | Quando Utilizar | Exemplo de Prompt |
|---|---|---|---|
| **Mobile Engineer** | [`mobile-engineer.md`](../.agents/agents/mobile-engineer.md) | Criação de telas, componentes visuais, animações Reanimated e integração com mapas (`react-native-maps`). | *"Como mobile-engineer, crie a tela de detalhes do restaurante no grupo (tabs) consumindo os contratos de API."* |
| **Backend Architect** | [`backend-architect.md`](../.agents/agents/backend-architect.md) | Criação de rotas Express, migrações do Prisma e regras de autenticação Supabase. | *"Como backend-architect, crie o endpoint de listagem de categorias com validação Zod e testes unitários."* |
| **QA & Security Auditor** | [`qa-auditor.md`](../.agents/agents/qa-auditor.md) | Execução de suítes de teste, auditoria de segurança de credenciais e checagem de DoD da sprint. | *"Como qa-auditor, valide a cobertura de testes do módulo de autenticação e verifique se há risco de vazamento de secrets."* |

---

## 6. Diretrizes Estritas de Segurança

1. **Proteção da Service Key**: A chave `SUPABASE_SERVICE_ROLE_KEY` é de uso **exclusivo** do backend (`apps/api`). É estritamente proibido utilizá-la ou expô-la no aplicativo móvel (`apps/mobile`).
2. **Prevenção de Dual-Write**: Toda criação de usuário no Supabase Auth deve possuir transação compensatória imediata em caso de falha de persistência no Prisma (veja o [ADR 0001](adr/0001-autenticacao-hibrida-supabase-prisma.md)).
3. **Validação na Borda**: Nunca confie em dados recebidos do cliente; valide todos os payloads HTTP usando os schemas compartilhados de `@menu-digital/contracts`.
4. **Commits Limpos**: Nunca comite arquivos `.env` ou credenciais locais no repositório Git.
