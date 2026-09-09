---
name: grill-with-docs
description: Entrevista o desenvolvedor para esclarecer requisitos de novas features, documenta decisões em ADRs (docs/adr/) e atualiza o vocabulário em CONTEXT.md.
---

# Skill: Grill with Docs (Alinhamento de Domínio e ADRs)

Inspirado na metodologia de Matt Pocock, esta skill é ativada sempre que uma nova funcionalidade, tela, entidade ou mudança arquitetural for solicitada no projeto Menu-Digital.

## Objetivo

Impedir a implementação com base em suposições incorretas. Antes de escrever código, o agente deve entrevistar o desenvolvedor, extrair regras de negócio claras, registrar a decisão em um ADR e consolidar a linguagem ubíqua em `CONTEXT.md`.

## Fluxo de Execução

### Fase 1: A Entrevista ("The Grilling")

Faça perguntas objetivas (uma ou duas de cada vez) abordando:
1. **Regra de negócio**: Como o fluxo se comporta nos casos de sucesso e nos casos de borda (erros, falha de rede, permissões negadas)?
2. **Entidades impactadas**: Afeta Restaurante, Cardápio, Item, Categoria, Mesa ou Pedido?
3. **Contrato de API**: Quais dados o mobile envia e o que a API devolve?
4. **Armazenamento**: Requer nova coluna/tabela no Prisma ou uso do Supabase Storage (ex: fotos de pratos)?

### Fase 2: Atualização do CONTEXT.md

Se a funcionalidade introduzir um novo termo ou refinar um conceito existente:
1. Abra `CONTEXT.md` na raiz do projeto.
2. Adicione ou atualize a definição do termo para que toda a equipe (e futuros agentes) utilizem o mesmo vocabulário.

### Fase 3: Registro de Decisão Arquitetural (ADR)

Se a mudança envolver uma escolha de arquitetura, biblioteca ou padrão técnico relevante:
1. Crie um novo arquivo em `docs/adr/XXXX-titulo-da-decisao.md`.
2. Siga a estrutura padrão:
   - **Status**: Proposto / Aceito / Substituído
   - **Contexto**: O problema ou desafio enfrentado
   - **Decisão**: A solução técnica adotada
   - **Consequências**: Benefícios, trade-offs e impactos no mobile/backend.

### Fase 4: Transição para o Plano de Implementação

Com as respostas consolidadas e documentadas, proceda com o plano de tarefas atômicas (TDD e tarefas por workspace).
