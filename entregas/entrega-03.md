# Entrega 03 — Evolução dos Restaurantes, Busca, Filtros e Ordenação

## Identificação

Terceira entrega do projeto Menu Digital, reunindo as funcionalidades desenvolvidas durante a Sprint 03.

## Sprint relacionada

Sprint 03 — Evolução dos Restaurantes, Busca, Filtros e Ordenação.

Issues relacionadas: #48 a #53.

Histórias de usuário relacionadas:

- HU5 — Listagem de Restaurantes.
- HU6 — Busca por Nome, Culinária e Cidade.
- HU7 — Filtros por Preço, Avaliação, Distância e Horário.
- HU8 — Ordenação dos Resultados.

## Escopo

Esta entrega contempla a evolução do cadastro dos restaurantes e a implementação de funcionalidades para descoberta e consulta de estabelecimentos.

Foram contemplados:

- Cadastro de conta específica para restaurante.
- Diferenciação entre contas de usuário e restaurante.
- Ampliação dos campos do perfil do restaurante.
- Cadastro e validação de CNPJ.
- Cadastro de telefone e descrição.
- Cadastro de faixa de preço.
- Cadastro dos horários de funcionamento.
- Cadastro de formas de pagamento.
- Cadastro de redes sociais.
- Suporte a fotos do estabelecimento.
- Endereço estruturado com latitude e longitude.
- Listagem paginada de restaurantes.
- Exibição dos restaurantes na tela inicial.
- Busca por nome, culinária e cidade.
- Filtros por preço, avaliação, distância e horário de funcionamento.
- Combinação de diferentes filtros.
- Ordenação por distância, avaliação, menor preço e maior preço.
- Tratamento de estados de carregamento, erro e ausência de resultados.

## Links principais

As principais referências desta entrega são:

- Issues #48 a #53.
- PR #60 — relacionada à Issue #48.
- PR #61 — relacionada à Issue #49.
- PR #62 — relacionada à Issue #50.
- PR #63 — relacionada à Issue #51.
- PR #64 — relacionada à Issue #52.
- PR #65 — correções relacionadas à Issue #52.
- PR #66 — relacionada à Issue #53.
- Documento `../sprints/sprint-03.md`.
- Documento `../docs/requisitos.md`.

## Critérios atendidos

- Cadastro de conta de restaurante implementado.
- Perfil do restaurante ampliado.
- Informações adicionais dos estabelecimentos armazenadas.
- Listagem paginada de restaurantes implementada.
- Restaurantes exibidos na tela inicial.
- Busca por nome, culinária e cidade implementada.
- Filtros combináveis implementados.
- Filtro por distância integrado à localização do usuário.
- Filtro por horário de funcionamento implementado.
- Ordenação dos resultados implementada.
- Estados de carregamento, erro e ausência de resultados tratados.

## Validação

A entrega pode ser validada por meio das Issues #48 a #53 e das Pull Requests #60 a #66.

Também podem ser utilizados como evidência:

- código-fonte versionado;
- histórico de commits e merges;
- fluxo de cadastro de restaurante;
- tela inicial com listagem de restaurantes;
- mecanismo de busca;
- filtros disponíveis;
- opções de ordenação.

A PR #65 complementa a implementação da Issue #52 com correções e ajustes relacionados aos filtros.

## Limitações

Funcionalidades relacionadas ao cálculo de rota e à tela completa de detalhes do restaurante ainda não faziam parte do escopo desta entrega.

Recursos baseados em distância dependem da disponibilidade da localização do usuário.

## Pendências conhecidas

Após esta entrega, ainda estavam previstas funcionalidades relacionadas a:

- cálculo de rota;
- tempo estimado de deslocamento;
- visualização detalhada do restaurante;
- evolução das funcionalidades relacionadas ao cardápio.

## Próximos passos

Dar continuidade ao projeto com:

- cálculo de rota até o restaurante;
- cálculo de distância e tempo estimado;
- exibição do trajeto no mapa;
- tela de detalhes do restaurante;
- integração das informações do estabelecimento em uma visualização detalhada.