# Entrega 04 — Rota, Detalhes do Restaurante e Infraestrutura de IA

## Identificação

Quarta entrega do projeto Menu Digital, reunindo as funcionalidades desenvolvidas durante a Sprint 04.

## Sprint relacionada

Sprint 04 — Rota, Detalhes do Restaurante e Infraestrutura de IA.

Issues relacionadas:

- #54 — Cálculo de Rota e Tempo Estimado — HU9.
- #55 — Tela de Detalhes do Restaurante — HU10.
- #70 — Integração Oficial da Toolchain de Agentes.

Histórias de usuário relacionadas:

- HU9 — Cálculo de Rota e Tempo Estimado.
- HU10 — Tela de Detalhes do Restaurante.

## Escopo

Esta entrega contempla a evolução da consulta dos restaurantes, permitindo visualizar informações detalhadas do estabelecimento e obter informações de rota até sua localização.

Também contempla melhorias na infraestrutura de desenvolvimento por meio da integração da toolchain de agentes de IA.

Foram contemplados:

- Cálculo de rota até o restaurante.
- Integração com o serviço OSRM.
- Cálculo e exibição da distância.
- Cálculo e exibição do tempo estimado.
- Exibição do trajeto no mapa utilizando Polyline.
- Tratamento de falhas relacionadas à localização.
- Tratamento de falhas do serviço de rotas.
- Alternativa utilizando distância em linha reta quando necessário.
- Implementação da tela de detalhes do restaurante.
- Implementação do endpoint de consulta de restaurante por ID.
- Exibição das fotos do estabelecimento.
- Exibição de nome, culinária, faixa de preço e avaliação.
- Exibição do endereço e localização no mapa.
- Integração das informações de rota na tela de detalhes.
- Preparação da tela para funcionalidades relacionadas ao cardápio.
- Estados de carregamento, erro e restaurante não encontrado.
- Integração da toolchain de agentes de IA.
- Versionamento das skills utilizadas pelos agentes.
- Documentação da infraestrutura de agentes.
- Implementação de mecanismos para verificação da configuração.

## Links principais

As principais referências desta entrega são:

- Issue #54 — Cálculo de Rota e Tempo Estimado.
- Issue #55 — Tela de Detalhes do Restaurante.
- Issue #70 — Integração Oficial da Toolchain de Agentes.
- PR #67 — relacionada à Issue #54.
- PR #68 — relacionada à Issue #55.
- PR #69 — relacionada à Issue #70.
- Documento `../sprints/sprint-04.md`.
- Documento `../docs/requisitos.md`.
- Documento `../AGENTS.md`.

## Critérios atendidos

- Cálculo de rota implementado.
- Integração com OSRM implementada.
- Distância até o restaurante disponibilizada.
- Tempo estimado disponibilizado.
- Trajeto exibido no mapa.
- Tratamento de falhas do serviço de rota implementado.
- Tela de detalhes do restaurante implementada.
- Consulta de restaurante por ID implementada.
- Informações detalhadas do estabelecimento disponibilizadas.
- Mapa integrado à tela de detalhes.
- Estados de carregamento e erro tratados.
- Toolchain de agentes integrada ao projeto.
- Skills dos agentes versionadas no repositório.
- Infraestrutura de agentes documentada e verificável.

## Validação

A entrega pode ser validada por meio das Issues #54, #55 e #70 e das Pull Requests #67, #68 e #69.

Também constituem evidências:

- código-fonte versionado;
- histórico de commits e merges;
- integração com o serviço OSRM;
- visualização da rota no mapa;
- informações de distância e tempo estimado;
- tela de detalhes do restaurante;
- endpoint de consulta de restaurante por ID;
- diretório `.agents/skills/`;
- documentação `AGENTS.md`;
- scripts e comandos de verificação da infraestrutura de agentes.

## Limitações

O cálculo de rota depende da disponibilidade do serviço externo OSRM e da localização do usuário.

Em caso de indisponibilidade do serviço de rotas, a aplicação possui tratamento alternativo previsto para cálculo de distância em linha reta.

Funcionalidades posteriores relacionadas ao cardápio não fazem parte do escopo desta entrega.

## Pendências conhecidas

A evolução do cardápio e outras histórias de usuário previstas para etapas posteriores ainda devem ser desenvolvidas e documentadas nas próximas sprints.

## Próximos passos

- Dar continuidade às próximas histórias de usuário.
- Evoluir as funcionalidades relacionadas ao cardápio.
- Atualizar a documentação conforme novas funcionalidades forem implementadas.
- Registrar novas sprints e entregas conforme o andamento do projeto.