# Sprint 04 — Rota, Detalhes do Restaurante e Infraestrutura de IA

## Período

Período referente à quarta sprint de desenvolvimento do projeto Menu Digital.

## Objetivo

Evoluir a experiência de consulta dos restaurantes por meio da implementação do cálculo de rota e tempo estimado e da tela de detalhes do restaurante, além de aprimorar a infraestrutura de desenvolvimento do projeto com a integração da toolchain de agentes de IA.

## Milestone

Sprint 04.

## Itens planejados

- #54 — Cálculo de Rota e Tempo Estimado — HU9
- #55 — Tela de Detalhes do Restaurante — HU10
- #70 — Integração Oficial da Toolchain de Agentes

## Responsáveis

As atividades foram distribuídas entre os integrantes da equipe por meio das issues do repositório no GitHub.

## Entregas

Durante a Sprint 04 foram desenvolvidas funcionalidades relacionadas à navegação até os restaurantes, visualização detalhada dos estabelecimentos e infraestrutura de desenvolvimento, incluindo:

- Implementação do cálculo de rota até o restaurante.
- Integração com o serviço OSRM para obtenção de rota e tempo estimado.
- Exibição da distância e do tempo estimado até o restaurante.
- Representação da rota no mapa utilizando Polyline.
- Tratamento de erros relacionados à localização e ao serviço de rotas.
- Implementação de alternativa baseada em distância em linha reta quando necessário.
- Criação da tela de detalhes do restaurante.
- Implementação do endpoint de consulta de restaurante por ID.
- Exibição de fotos, nome, culinária, faixa de preço, avaliação e endereço.
- Integração do mapa na tela de detalhes.
- Integração das informações de rota com a tela de detalhes.
- Preparação da tela para integração com o cardápio.
- Implementação de estados de carregamento, erro e restaurante não encontrado.
- Integração da toolchain de agentes de IA utilizada no desenvolvimento.
- Versionamento das skills utilizadas pelos agentes.
- Documentação da utilização dos agentes no projeto.
- Inclusão de mecanismos de verificação da configuração da infraestrutura de IA.

## Issues concluídas

A Sprint 04 contemplou as seguintes issues:

- #54 — Cálculo de Rota e Tempo Estimado — HU9
- #55 — Tela de Detalhes do Restaurante — HU10
- #70 — Integração Oficial da Toolchain de Agentes

## PRs aceitos

As seguintes Pull Requests estão relacionadas às implementações desta sprint:

- PR #67 — Issue #54 — Cálculo de Rota e Tempo Estimado.
- PR #68 — Issue #55 — Tela de Detalhes do Restaurante.
- PR #69 — Issue #70 — Integração Oficial da Toolchain de Agentes.

## Evidências

As principais evidências da Sprint 04 estão disponíveis no repositório:

- Issues #54, #55 e #70.
- Pull Requests #67, #68 e #69.
- Código-fonte das funcionalidades implementadas.
- Histórico de commits e merges.
- Integração com o serviço OSRM.
- Exibição da rota no mapa.
- Cálculo de distância e tempo estimado.
- Tela de detalhes do restaurante.
- Endpoint de consulta de restaurante por ID.
- Arquivos e documentação relacionados à infraestrutura de agentes.
- Skills versionadas no diretório `.agents/skills/`.
- Documentação `AGENTS.md`.
- Script e comandos de verificação da infraestrutura de IA.

## Impedimentos

Não foram identificados impedimentos documentados nas informações utilizadas para elaboração deste registro.

## Retrospectiva

A Sprint 04 avançou a experiência de consulta dos restaurantes, permitindo acessar informações detalhadas dos estabelecimentos e obter dados de rota, distância e tempo estimado.

Também houve evolução na infraestrutura de desenvolvimento com a integração e documentação da toolchain de agentes de IA, permitindo maior padronização das ferramentas utilizadas durante o desenvolvimento.

## Próximas ações

Dar continuidade ao desenvolvimento das próximas histórias de usuário do Menu Digital, incluindo a evolução das funcionalidades relacionadas ao cardápio e demais requisitos definidos para as próximas sprints.