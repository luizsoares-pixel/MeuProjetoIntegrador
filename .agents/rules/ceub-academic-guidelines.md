# Diretrizes Acadêmicas CEUB (Projeto Integrador II)

Este documento orienta o agente e a equipe quanto aos padrões acadêmicos institucionais do CEUB para o desenvolvimento do projeto **Menu-Digital**.

## 1. Estrutura de Sprints e Entregas

- O projeto é organizado em ciclos de desenvolvimento detalhados na pasta `sprints/` (ex: `sprint-00-planejamento.md`).
- Todas as entregas parciais e finais devem ser consolidadas e referenciadas em `entregas/README.md`.
- Cada sprint deve conter:
  1. **Objetivo verificável**: o que será demonstrável ao final da sprint.
  2. **Backlog priorizado**: lista de tarefas com vínculo para as issues do GitHub.
  3. **Riscos e mitigações**.
  4. **Critérios de aceitação e Definition of Done (DoD)**.

## 2. Documentação Técnica Obrigatória

- **Arquitetura (`docs/arquitetura.md`)**:
  - Manter atualizada a visão de componentes, integrações e fluxo de dados da solução.
- **Requisitos (`docs/requisitos.md`)**:
  - Requisitos funcionais (RFs) e não-funcionais (RNFs) com rastreabilidade direta para as issues do backlog.
- **Decisões Arquiteturais (ADRs em `docs/adr/`)**:
  - Toda decisão técnica relevante (escolha de banco, estratégias de autenticação, padrões de mapa) deve ser formalizada em um ADR numerado (`0001-...md`, `0002-...md`).

## 3. Qualidade de Código e Definition of Done (DoD)

Para que uma funcionalidade seja considerada concluída:
1. Os tipos TypeScript devem compilar sem erros (`npm run lint -w apps/api` e `npm run lint -w apps/mobile`).
2. Os testes automatizados da suíte devem passar (`npm run test -w apps/api`).
3. O código deve seguir o lint e formatação definidos em `.editorconfig` e `.markdownlint.json`.
4. Commits devem ser semânticos (ex: `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
5. Pull Requests devem seguir o template institucional em `.github/PULL_REQUEST_TEMPLATE.md`.
