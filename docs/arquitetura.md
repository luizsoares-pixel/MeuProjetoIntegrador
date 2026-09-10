# Arquitetura

Este documento é um template genérico e deve permanecer independente de stack até que a turma defina oficialmente a sua tecnologia.

## Contexto técnico

Descreva as restrições do problema, o ambiente acadêmico, o tipo de produto, os canais de uso, os requisitos de operação e os limites conhecidos, sem antecipar linguagem, framework ou provedor antes da decisão da turma.

## Componentes

Mapeie os principais blocos da solução, suas responsabilidades, fronteiras e relações, usando nomes funcionais como interface, serviço, processamento, armazenamento ou integração.

## Integrações

Registre os sistemas externos, as APIs, as plataformas institucionais, as fontes de dados ou os serviços de terceiros previstos, incluindo finalidade, risco e dependência.

## Dados

Explique quais dados entram, como circulam, onde são armazenados, quais cuidados de privacidade se aplicam e como o time pretende manter a consistência e a rastreabilidade.

## Decisões técnicas

Documente os critérios de escolha, as opções consideradas, os trade-offs e o momento da decisão. Até a definição da turma, use este espaço para registrar perguntas, premissas e restrições, e não para fixar a stack.

## Riscos

Liste os riscos técnicos, de integração, de dados, de prazo e de dependência externa, com o impacto esperado e a estratégia de mitigação.

## Diagramas e relação com ADRs

Inclua diagramas de contexto, componentes, fluxo ou implantação quando ajudarem a explicar a solução. Quando uma decisão técnica for consolidada, registre o racional em um ADR e vincule o diagrama ou a seção correspondente.

### Registros de Decisões Arquiteturais (ADRs)

Todas as decisões arquiteturais da solução são documentadas formalmente em [docs/adr/](adr/):
* **[ADR 0001](adr/0001-autenticacao-hibrida-supabase-prisma.md)**: Autenticação Híbrida Supabase Auth e Prisma ORM com Transação Compensatória para Prevenção do Dual-Write Problem.
* **[ADR 0002](adr/0002-expo-router-v6-e-reanimated.md)**: Roteamento Baseado em Arquivos com Expo Router v6 e Animações com Reanimated.
* **[ADR 0003](adr/0003-contratos-compartilhados-zod-monorepo.md)**: Desenvolvimento Contract-First com Zod em Monorepo Compartilhado.
* **[ADR 0004](adr/0004-arquitetura-mapas-geolocalizacao-hibrida.md)**: Arquitetura de Mapas, Geolocalização Híbrida e Agrupamento Espacial.

Para detalhes sobre a governança técnica e os agentes que auxiliam na manutenção dessa arquitetura, consulte o **[Guia de Desenvolvimento com IA](desenvolvimento-com-ia.md)**.

