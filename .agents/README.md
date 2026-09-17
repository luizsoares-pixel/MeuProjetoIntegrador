# Estrutura de Customizações do Antigravity (.agents)

Este diretório contém as **customizações de workspace** descobertas e carregadas nativamente pelo **Google Antigravity 2.0**.

---

## 1. Como o Antigravity Descobre este Diretório

O Antigravity CLI faz uma varredura hierárquica a partir do diretório atual de trabalho (CWD) até a raiz do repositório Git procurando pela pasta `.agents/`.

Ele utiliza o conceito de **Divulgação Progressiva (Progressive Disclosure)**:
* As **regras** (`rules/*.md`) são avaliadas contextual ou condicionalmente pelo modelo para guiar o estilo e restrições.
* As **skills** (`skills/*/SKILL.md`) têm apenas seus nomes e descrições mantidos no índice primário. O conteúdo completo de uma skill só é injetado no contexto quando a skill é ativada pelo usuário ou pelo fluxo do agente.
* Os **subagentes** (`agents/*.md`) definem os perfis e sistemas de prompt para delegação paralela ou especializada via `invoke_subagent`.

---

## 2. Conteúdo do Diretório

```
.agents/
├── README.md               # Esta documentação técnica interna
├── agents/                 # Definições de subagentes especializados
│   ├── backend-architect.md
│   ├── mobile-engineer.md
│   └── qa-auditor.md
├── rules/                  # Regras de código e restrições de stack
│   ├── backend-prisma-supabase.md
│   ├── ceub-academic-guidelines.md
│   ├── contracts-monorepo.md
│   └── expo-mobile.md
└── skills/                 # Procedimentos operacionais e rotinas (Superpowers + Matt Pocock + ECC)
    ├── backend-patterns-ecc/         # Padrões arquiteturais Express 5 e Prisma (ECC)
    ├── code-review-matt/             # Revisão em 2 eixos: Padrões + Especificação (Matt Pocock)
    ├── domain-modeling-matt/         # Vocabulário ubíquo em CONTEXT.md e ADRs (Matt Pocock)
    ├── finishing-a-development-branch/ # Checklist e finalização de branch segura (Superpowers)
    ├── frontend-patterns-ecc/        # Padrões React Native, SafeArea e tokens (ECC)
    ├── grill-with-docs/              # Entrevista iterativa de requisitos (Matt Pocock)
    ├── security-review-ecc/          # Checklist e auditoria de segurança (ECC)
    ├── subagent-driven-development/  # Execução autônoma por subagentes (Superpowers)
    ├── systematic-debugging/         # Investigação de causa raiz antes de fixes (Superpowers)
    ├── tdd-workflow-ecc/             # Workflow TDD com cobertura 80%+ (ECC)
    ├── test-driven-development/      # Princípios estritos de TDD (Superpowers)
    ├── verification-before-completion/ # Exigência de evidências reais (Superpowers)
    ├── verify-monorepo/              # Validação de testes, build e linter do monorepo
    ├── wayfinder-matt/               # Decomposição de demandas em marcos (Matt Pocock)
    └── writing-plans/                # Planos atômicos pré-implementação (Superpowers)
```

---

## 3. Como Criar Novas Regras ou Skills

### Adicionando uma Regra
Crie um arquivo `.md` em `.agents/rules/` com diretrizes claras e concisas. Evite regras muito longas que consumam contexto desnecessariamente; priorize checklists, padrões de nomenclatura e restrições arquiteturais.

### Adicionando uma Skill
Crie uma pasta em `.agents/skills/<nome-da-skill>/` contendo um arquivo `SKILL.md` com cabeçalho YAML obrigatório:
```yaml
---
name: minha-skill
description: Descrição sucinta de quando e para que o agente deve utilizá-la.
---
```

Para mais detalhes sobre as diretrizes do projeto e boas práticas, consulte o [Guia de Desenvolvimento com IA](../docs/desenvolvimento-com-ia.md).
