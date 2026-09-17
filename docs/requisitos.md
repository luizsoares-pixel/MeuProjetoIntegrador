# Requisitos — Menu Digital

## Visão do produto

O Menu Digital é uma aplicação desenvolvida para facilitar a descoberta e consulta de restaurantes. A solução permite que usuários encontrem estabelecimentos próximos utilizando geolocalização, visualizem restaurantes em um mapa, realizem buscas, apliquem filtros, consultem informações detalhadas e obtenham dados de rota, distância e tempo estimado.

O sistema também oferece funcionalidades destinadas aos restaurantes, permitindo o cadastro de contas e o registro de informações do estabelecimento.

## Público-alvo

O projeto possui dois principais tipos de usuários:

- Usuários que desejam localizar e consultar restaurantes.
- Responsáveis por restaurantes que desejam cadastrar e disponibilizar informações sobre seus estabelecimentos.

No contexto acadêmico, o projeto também é acompanhado e avaliado pela equipe responsável pela disciplina.

## Problema

Usuários podem ter dificuldade para encontrar restaurantes próximos que atendam às suas preferências e para consultar, em um único local, informações como localização, culinária, faixa de preço, avaliação, horário de funcionamento e distância.

O projeto busca centralizar essas informações e facilitar a descoberta de restaurantes utilizando recursos de busca, filtros, geolocalização e mapas.

## Objetivos

O objetivo principal é desenvolver uma aplicação que facilite a descoberta e consulta de restaurantes.

Objetivos específicos:

- Permitir cadastro e autenticação de usuários.
- Permitir cadastro de contas de restaurantes.
- Utilizar a localização do usuário para encontrar restaurantes próximos.
- Exibir restaurantes em um mapa interativo.
- Disponibilizar listagem de restaurantes.
- Permitir busca por diferentes informações.
- Permitir aplicação de filtros.
- Permitir ordenação dos resultados.
- Disponibilizar informações detalhadas dos restaurantes.
- Calcular rota, distância e tempo estimado até o estabelecimento.
- Manter uma arquitetura organizada e documentada.

## Requisitos funcionais

### RF01 — Cadastro de usuário

O sistema deve permitir que novos usuários realizem cadastro na aplicação.

### RF02 — Autenticação de usuário

O sistema deve permitir que usuários cadastrados realizem login.

A autenticação utiliza Supabase e Prisma no backend, com utilização de tokens JWT para acesso às funcionalidades protegidas.

### RF03 — Recuperação de senha

O sistema deve permitir que o usuário solicite a recuperação de sua senha.

### RF04 — Redefinição de senha

O sistema deve permitir que o usuário defina uma nova senha após iniciar o processo de recuperação.

### RF05 — Manutenção da autenticação

O sistema deve manter o estado de autenticação do usuário durante a utilização da aplicação.

### RF06 — Localização do usuário — HU1

O sistema deve solicitar permissão de localização e, quando autorizada, capturar e exibir a localização atual do usuário.

O sistema deve tratar situações como:

- permissão de localização negada;
- GPS desativado;
- falha na obtenção da localização.

### RF07 — Restaurantes próximos

O backend deve disponibilizar uma consulta de restaurantes próximos com base na latitude, longitude e raio informado.

Os resultados devem considerar a distância entre o usuário e os restaurantes.

### RF08 — Exibição de restaurantes no mapa — HU2

O sistema deve exibir restaurantes próximos por meio de marcadores no mapa.

Os marcadores devem permitir acesso a informações básicas do estabelecimento.

### RF09 — Agrupamento de marcadores — HU3

O sistema deve permitir o agrupamento de marcadores quando houver diversos restaurantes próximos no mapa, reduzindo a sobreposição de elementos.

### RF10 — Cadastro básico de restaurante — HU4

O sistema deve permitir o cadastro de um restaurante com suas informações básicas e localização.

### RF11 — Cadastro de conta de restaurante

O sistema deve permitir a criação de uma conta destinada ao responsável por um restaurante.

O sistema deve diferenciar contas de usuários comuns e contas de restaurantes.

### RF12 — Perfil ampliado do restaurante

O sistema deve permitir o armazenamento de informações adicionais do restaurante, incluindo:

- CNPJ;
- telefone;
- descrição;
- faixa de preço;
- horários de funcionamento;
- formas de pagamento;
- redes sociais;
- fotos;
- endereço;
- latitude e longitude.

### RF13 — Listagem de restaurantes — HU5

O sistema deve disponibilizar uma listagem paginada de restaurantes.

A tela inicial deve apresentar informações relevantes dos estabelecimentos e tratar situações de carregamento, erro e ausência de resultados.

### RF14 — Busca de restaurantes — HU6

O sistema deve permitir buscar restaurantes utilizando:

- nome;
- culinária;
- cidade.

### RF15 — Filtros de restaurantes — HU7

O sistema deve permitir filtrar restaurantes por:

- faixa de preço;
- avaliação mínima;
- distância;
- horário de funcionamento.

Os filtros devem poder ser utilizados de forma combinada.

### RF16 — Ordenação dos resultados — HU8

O sistema deve permitir ordenar os restaurantes utilizando critérios como:

- distância;
- avaliação;
- menor preço;
- maior preço.

Quando a ordenação por distância for utilizada, a localização do usuário deve estar disponível.

### RF17 — Cálculo de rota e tempo estimado — HU9

O sistema deve permitir calcular a rota entre a localização do usuário e o restaurante selecionado.

Devem ser disponibilizadas informações de:

- distância;
- tempo estimado;
- trajeto no mapa.

A aplicação utiliza o serviço OSRM para obtenção das informações de rota.

### RF18 — Detalhes do restaurante — HU10

O sistema deve possuir uma tela de detalhes do restaurante.

Essa tela deve disponibilizar informações como:

- fotos;
- nome;
- culinária;
- faixa de preço;
- avaliação;
- endereço;
- localização no mapa;
- rota;
- distância;
- tempo estimado.

## Requisitos não funcionais

### RNF01 — Usabilidade

A interface deve fornecer feedback visual durante operações de carregamento, sucesso e erro.

### RNF02 — Validação

Os dados fornecidos pelos usuários devem ser validados antes do processamento sempre que aplicável.

### RNF03 — Segurança

Funcionalidades protegidas devem exigir autenticação válida.

Credenciais e informações sensíveis de serviços externos não devem ser expostas diretamente no aplicativo cliente.

### RNF04 — Organização do código

O projeto deve utilizar uma estrutura organizada, com componentes reutilizáveis, hooks, tipos e contratos compartilhados quando aplicável.

### RNF05 — Manutenibilidade

O código e as decisões arquiteturais devem ser documentados e versionados no repositório.

### RNF06 — Tratamento de erros

A aplicação deve tratar falhas de rede, localização, autenticação e serviços externos, apresentando feedback adequado ao usuário.

### RNF07 — Desempenho

A aplicação deve buscar manter uma experiência adequada mesmo com múltiplos restaurantes sendo exibidos, utilizando mecanismos como paginação e agrupamento de marcadores.

## Tecnologias e integrações relacionadas aos requisitos

Entre as tecnologias e serviços utilizados na implementação dos requisitos estão:

- React Native;
- Expo;
- TypeScript;
- Expo Router;
- Supabase;
- Prisma;
- PostgreSQL;
- react-native-maps;
- expo-location;
- OpenStreetMap;
- OSRM;
- JWT;
- Zod.

## Rastreabilidade por Sprint

### Sprint 01

Issues #1 a #14.

Principais áreas:

- estrutura inicial do projeto;
- autenticação;
- cadastro;
- recuperação de senha;
- validações;
- componentes reutilizáveis;
- organização visual.

### Sprint 02

Issues #31 a #37.

Histórias de usuário relacionadas:

- HU1 — Localização do usuário;
- HU2 — Pins de restaurantes;
- HU3 — Clustering;
- HU4 — Cadastro básico de restaurante.

### Sprint 03

Issues #48 a #53.

Histórias de usuário relacionadas:

- HU5 — Listagem de restaurantes;
- HU6 — Busca;
- HU7 — Filtros;
- HU8 — Ordenação.

Pull Requests relacionadas: #60 a #66.

### Sprint 04

Issues #54, #55 e #70.

Histórias de usuário relacionadas:

- HU9 — Cálculo de rota e tempo estimado;
- HU10 — Tela de detalhes do restaurante.

Pull Requests relacionadas:

- PR #67 — HU9;
- PR #68 — HU10;
- PR #69 — infraestrutura de agentes de IA.

## Requisitos futuros

Os requisitos que ainda não foram implementados devem ser adicionados a este documento conforme forem definidos e planejados nas próximas sprints.

Um dos próximos recursos previstos no fluxo da aplicação é a evolução das funcionalidades relacionadas ao cardápio do restaurante.

## Controle e atualização

Este documento deve ser atualizado sempre que:

- um novo requisito for definido;
- uma história de usuário for adicionada;
- um requisito sofrer alteração significativa;
- uma nova sprint implementar funcionalidades que alterem o escopo do produto.

A rastreabilidade detalhada das atividades deve ser mantida nas issues, Pull Requests e documentos das respectivas sprints.