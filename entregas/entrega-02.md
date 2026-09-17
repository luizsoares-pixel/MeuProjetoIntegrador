# Entrega 02 — Mapa, Localização e Restaurantes Próximos

## Identificação

Segunda entrega do projeto Menu Digital, reunindo as funcionalidades desenvolvidas durante a Sprint 02.

## Sprint relacionada

Sprint 02 — Mapa, Localização e Restaurantes Próximos.

Issues relacionadas: #31 a #37.

Histórias de usuário relacionadas:

- HU1 — Captura e Exibição da Localização do Usuário.
- HU2 — Exibição de Pins de Restaurantes no Mapa.
- HU3 — Clustering de Pins no Mapa.
- HU4 — Cadastro Básico de Restaurante.

## Escopo

Esta entrega contempla a implementação das funcionalidades de mapa, geolocalização, restaurantes próximos e cadastro básico de estabelecimentos.

Foram contemplados:

- Integração do mapa interativo utilizando `react-native-maps`.
- Utilização de tiles do OpenStreetMap.
- Integração com `expo-location`.
- Solicitação de permissão para acesso à localização.
- Captura da localização atual do usuário.
- Exibição da localização do usuário no mapa.
- Tratamento de permissão negada e GPS desativado.
- Implementação do endpoint de restaurantes próximos.
- Utilização de latitude e longitude dos restaurantes.
- Cálculo de distância para identificação dos estabelecimentos próximos.
- Exibição dos restaurantes por meio de pins no mapa.
- Exibição de informações básicas dos restaurantes nos marcadores.
- Implementação de clustering de pins.
- Cadastro básico de restaurantes.
- Validações dos dados do restaurante.
- Implementação de feedback visual nos estados de carregamento e erro.
- Opção de nova tentativa em situações de falha de rede.

## Links principais

As evidências desta entrega podem ser consultadas no repositório por meio de:

- Issues #31 a #37.
- Histórico de commits.
- Pull Requests relacionadas às respectivas issues.
- Documento `../sprints/sprint-02.md`.
- Documento `../docs/requisitos.md`.

## Critérios atendidos

- Mapa interativo integrado à aplicação.
- Permissão de localização implementada.
- Localização atual do usuário exibida no mapa.
- Endpoint para consulta de restaurantes próximos implementado.
- Restaurantes exibidos por meio de marcadores.
- Informações básicas dos restaurantes disponibilizadas nos marcadores.
- Agrupamento de marcadores implementado.
- Cadastro básico de restaurante implementado.
- Tratamento de estados de carregamento e erro implementado.
- Tratamento de falhas relacionadas à localização implementado.

## Validação

A entrega pode ser validada por meio das issues relacionadas, código versionado e histórico do repositório.

Entre os cenários previstos para validação estão:

- funcionamento do mapa em dispositivo móvel;
- obtenção da localização do usuário;
- tratamento de permissão de localização negada;
- consulta de restaurantes próximos;
- exibição dos restaurantes no mapa;
- funcionamento do clustering com múltiplos restaurantes;
- cadastro de restaurante;
- tratamento de erros de rede e localização.

## Limitações

Os números específicos das Pull Requests desta sprint não foram incluídos neste documento por não terem sido confirmados na documentação utilizada para este registro.

O funcionamento de recursos de localização também depende das permissões do dispositivo e da disponibilidade dos serviços utilizados pela aplicação.

## Pendências conhecidas

Nesta entrega ainda não estavam contempladas as funcionalidades avançadas de listagem, busca, filtros e ordenação de restaurantes, que foram desenvolvidas posteriormente.

## Próximos passos

Dar continuidade ao projeto com:

- ampliação dos dados do restaurante;
- cadastro de conta específica para restaurante;
- listagem de restaurantes na tela inicial;
- busca por restaurantes;
- filtros;
- ordenação dos resultados.