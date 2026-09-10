# Menu Digital — Cardápio Interativo & Descoberta Gastronômica

Repositório institucional de Projeto Integrador II do curso de Análise e Desenvolvimento de Sistemas (ADS) — **CEUB**.

> **Professor(a):** Consulte as diretrizes institucionais no repositório [DIRETRIZES](https://github.com/CAMPUSCEUB/DIRETRIZES), em especial o [Guia dos Professores](https://github.com/CAMPUSCEUB/DIRETRIZES/guias/github-enterprise-campus-ceub.md).  
> **Estudante:** Consulte o [guia dos alunos](docs/guia-alunos.md) e o [Guia de Desenvolvimento com IA](docs/desenvolvimento-com-ia.md).

---

## Identificação do Repositório

| Campo | Informação |
|---|---|
| **Instituição** | Centro Universitário de Brasília (CEUB) |
| **Curso / Disciplina** | ADS — Projeto Integrador II (2026/2) |
| **Organização no GitHub** | CampusCEUB |
| **Equipe** | Grupo 2 |
| **ID do Projeto** | ADS20262Grupo2MenuDigital |

---

## Problema

Consumidores enfrentam frequente desinformação ao buscar opções gastronômicas:
- **Cardápios estáticos e desatualizados**: Dependência de fotos ou arquivos PDF em redes sociais com preços e pratos defasados.
- **Falta de contexto geográfico**: Dificuldade em localizar restaurantes abertos e relevantes próximos à sua localização física em tempo real.
- **Inconsistência de informações**: Falta de transparência sobre disponibilidade imediata de pratos, ingredientes e restrições alimentares.
- **Gargalos operacionais**: Para gestores de restaurantes, a atualização manual de cardápios impressos ou digitais fragmentados gera retrabalho e inconsistências no atendimento.

---

## Solução Proposta

O **Menu Digital** é uma solução completa para descoberta gastronômica e consulta dinâmica de cardápios, estruturada em arquitetura monorepo:

1. **Aplicativo Mobile (Consumidor)**:
   - Construído com **Expo SDK 54**, **React Native 0.81** e **Expo Router v6**.
   - Mapa interativo com geolocalização em tempo real (`react-native-maps`), busca por raio de proximidade em metros e agrupamento espacial inteligente (`supercluster`).
   - Cards de pré-visualização rápida e navegação intuitiva por categorias de pratos e detalhes do estabelecimento.
2. **API Backend RESTful (Gestão e Serviços)**:
   - Desenvolvida em **Express 5** e **TypeScript** com persistência relacional via **Prisma ORM 6.19** no PostgreSQL.
   - Autenticação e autorização robustas via **Supabase Auth** com transação compensatória para prevenção do problema de *dual-write* ([ADR 0001](docs/adr/0001-autenticacao-hibrida-supabase-prisma.md)).
   - Cálculo geodésico de distâncias por fórmula de Haversine com filtros espaciais.
3. **Contratos Compartilhados (Contract-First)**:
   - Pacote compartilhado **`@menu-digital/contracts`** centralizando schemas de validação **Zod** e tipos TypeScript inferidos automaticamente, garantindo tipagem ponta a ponta sem duplicação de código ([ADR 0003](docs/adr/0003-contratos-compartilhados-zod-monorepo.md)).

---

## Estrutura do Monorepo

```
ADS20262Grupo2MenuDigital/
├── apps/
│   ├── api/          # Backend REST em Express 5, Prisma 6 e Supabase
│   └── mobile/       # App móvel em Expo SDK 54, React Native e Mapas
├── packages/
│   └── contracts/    # Schemas Zod e tipagens compartilhadas (Contract-First)
├── docs/             # Documentação técnica, requisitos, arquitetura e ADRs
│   └── adr/          # Registros formais de Decisões Arquiteturais (0001 a 0004)
├── sprints/          # Planejamento e acompanhamento de ciclos de sprint
├── entregas/         # Evidências e relatórios de marcos institucionais
└── .agents/          # Diretrizes, regras e skills para agentes de IA (Antigravity)
```

| Item | Link |
|---|---|
| **Backlog** | [GitHub Project Board](https://github.com/orgs/CampusCEUB/projects) |
| **Sprints** | [sprints/README.md](sprints/README.md) |
| **Entregas** | [entregas/README.md](entregas/README.md) |
| **Requisitos** | [docs/requisitos.md](docs/requisitos.md) |
| **Arquitetura** | [docs/arquitetura.md](docs/arquitetura.md) |
| **Decisões (ADRs)** | [docs/adr/](docs/adr/) |
| **Desenvolvimento com IA** | [docs/desenvolvimento-com-ia.md](docs/desenvolvimento-com-ia.md) |

---

## Guia de Instalação e Execução

### Pré-requisitos
- **Node.js**: `>= 22.0.0`
- **npm**: `>= 10.0.0`

### 1. Clonar e Instalar Dependências
```powershell
git clone https://github.com/CampusCEUB/ADS20262Grupo2MenuDigital.git
cd ADS20262Grupo2MenuDigital
npm install
```

### 2. Gerar Prisma Client e Compilar Contratos
```powershell
npm run prisma:generate
npm run build:contracts
```

### 3. Executar o Ambiente de Desenvolvimento
```powershell
# Executa simultaneamente a API (porta 3000) e o Metro Bundler do Mobile
npm run dev
```

### 4. Bateria Completa de Verificação (CI Local)
```powershell
# Executa compilação dos contratos, linter da API, testes unitários e linter mobile
npm run verify
```

---

## Engenharia e Desenvolvimento com Agentes de IA

O desenvolvimento deste projeto adota governança de software aumentada por IA utilizando o **Google Antigravity IDE** e o **Antigravity CLI** (`agy`), operando sob Test-Driven Development (TDD estrito), convenções semânticas e auditoria de segurança contínua.

Nossa arquitetura agentica combina as melhores práticas de três referências globais do ecossistema:
* 🦸 **[obra/superpowers](https://github.com/obra/superpowers)**: Metodologia de desenvolvimento orientada a especificações atômicas, ciclo Red/Green/Refactor e subagentes com contexto isolado.
* 🎯 **[mattpocock/skills](https://github.com/mattpocock/skills)**: Entrevista de alinhamento pré-código (`grill-with-docs`), consolidação de Linguagem Ubíqua no [CONTEXT.md](CONTEXT.md) e documentação de decisões em [docs/adr/](docs/adr/).
* 🛡️ **[affaan-m/ECC](https://github.com/affaan-m/ECC)**: Diretrizes de segurança do AgentShield contra vazamento de credenciais e regras contextuais por stack em `.agents/rules/`.

Consulte o **[Guia de Desenvolvimento com IA](docs/desenvolvimento-com-ia.md)** e o arquivo mestre **[AGENTS.md](AGENTS.md)** para instruções de onboarding da equipe.
