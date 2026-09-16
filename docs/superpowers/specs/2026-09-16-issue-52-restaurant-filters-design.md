# Design Spec: Issue #52 - Filtros por Preço, Avaliação, Distância e Horário (HU7)

- **Autor**: Equipe Menu Digital / Antigravity Agent
- **Data**: 2026-09-16
- **Branch**: `feature/52-filtros-preco-avaliacao-distancia-horario`
- **Issue**: [#52](https://github.com/CAMPUSCEUB/ADS-PI-II-MenuDigital/issues/52)
- **Status**: Aprovado

---

## 1. Visão Geral e Objetivos

Esta especificação define o design técnico e arquitetural para a **HU7**:
> *"Como usuário, quero filtrar restaurantes por preço, avaliação, distância e horário, para refinar os resultados."*

### Critérios de Aceite
1. Endpoint `GET /restaurants?priceRange=&minRating=&maxDistance=&openNow=&lat=&lng=` implementado.
2. `maxDistance` exige `lat`/`lng` nos params (mesma lógica de Haversine do endpoint nearby).
3. `openNow=true` filtra restaurantes com base no `businessHours` e horário atual do servidor (timezone `America/Sao_Paulo`).
4. Filtros combináveis entre si e com `search`, `cuisine`, `city`, `page`, `limit`.
5. Botão/ícone de filtros na tela com badge de contagem de filtros ativos.
6. Modal/bottom sheet de filtros com:
   - Faixa de preço (chips $, $$, $$$).
   - Avaliação mínima (chips: 3.0+, 3.5+, 4.0+, 4.5+).
   - Distância máxima (chips: 1km, 3km, 5km, 10km).
   - Switch "Aberto agora".
   - Botão "Limpar filtros".
   - Botão "Aplicar filtros".
7. Se permissão de localização for negada, filtro de distância desabilitado com aviso amigável.
8. Testes unitários para a lógica de filtros (combinações, edge cases de horário e virada de noite).
9. Testes e validação no app mobile.

---

## 2. Contratos Compartilhados (`packages/contracts`)

### 2.1 Atualização de `listRestaurantsQuerySchema`
O schema de query no Zod passa a receber e validar:
- `priceRange`: string opcional. Pode ser valor único ou lista delimitada por vírgula (`$`, `$$`, `$$$`). Transformado em array `PriceRange[]`.
- `minRating`: string opcional, convertida para número entre 1 e 5.
- `maxDistance`: string opcional, convertida para número positivo (em metros).
- `openNow`: string/boolean opcional, convertida para booleano (`true` se `"true"` ou `true`).
- `lat`: string opcional, convertida para número entre -90 e 90.
- `lng`: string opcional, convertida para número entre -180 e 180.
- **Refinement**: Caso `maxDistance !== undefined`, `lat` e `lng` devem obrigatoriamente estar presentes.

```typescript
export const listRestaurantsQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : 1))
      .refine((v) => !isNaN(v) && Number.isInteger(v) && v >= 1, {
        message: "O parâmetro 'page' deve ser um número inteiro maior ou igual a 1.",
      }),
    limit: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : 10))
      .refine((v) => !isNaN(v) && Number.isInteger(v) && v >= 1 && v <= 50, {
        message: "O parâmetro 'limit' deve ser um número inteiro entre 1 e 50.",
      }),
    search: z
      .string()
      .trim()
      .max(100, "O termo de busca não pode exceder 100 caracteres.")
      .optional(),
    cuisine: z
      .string()
      .trim()
      .max(50, "O filtro de culinária não pode exceder 50 caracteres.")
      .optional(),
    city: z
      .string()
      .trim()
      .max(100, "O filtro de cidade não pode exceder 100 caracteres.")
      .optional(),
    priceRange: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const raw = Array.isArray(val) ? val.join(",") : val;
        const items = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        return items.length > 0 ? items : undefined;
      })
      .refine(
        (items) =>
          items === undefined ||
          items.every((item) => ["$", "$$", "$$$"].includes(item)),
        {
          message:
            "O parâmetro 'priceRange' deve conter apenas valores válidos: $, $$, $$$.",
        }
      )
      .transform((items) => items as ("$" | "$$" | "$$$")[] | undefined),
    minRating: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : undefined))
      .refine((v) => v === undefined || (!isNaN(v) && v >= 1 && v <= 5), {
        message: "O parâmetro 'minRating' deve ser um número entre 1 e 5.",
      }),
    maxDistance: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : undefined))
      .refine((v) => v === undefined || (!isNaN(v) && v > 0), {
        message: "O parâmetro 'maxDistance' deve ser um número positivo em metros.",
      }),
    openNow: z
      .union([z.string(), z.boolean()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === "") return undefined;
        if (typeof v === "boolean") return v;
        return v === "true";
      }),
    lat: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : undefined))
      .refine((v) => v === undefined || (!isNaN(v) && v >= -90 && v <= 90), {
        message: "O parâmetro 'lat' deve ser entre -90 e 90.",
      }),
    lng: z
      .string()
      .optional()
      .transform((v) => (v !== undefined && v.trim() !== "" ? Number(v) : undefined))
      .refine((v) => v === undefined || (!isNaN(v) && v >= -180 && v <= 180), {
        message: "O parâmetro 'lng' deve ser entre -180 e 180.",
      }),
  })
  .superRefine((data, ctx) => {
    if (
      data.maxDistance !== undefined &&
      (data.lat === undefined || data.lng === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Os parâmetros 'lat' e 'lng' são obrigatórios quando 'maxDistance' for informado.",
        path: ["maxDistance"],
      });
    }
  });
```

---

## 3. Lógica de Backend (`apps/api`)

### 3.1 Cálculo de `openNow` (`isRestaurantOpen`)
- Função pura `isRestaurantOpen(businessHours: any, referenceDate?: Date): boolean`.
- Fuso horário oficial: `America/Sao_Paulo`.
- Dias da semana: `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`.
- Resolução de turnos:
  - Turno regular (`open < close`): aberto se `horaAtual >= open && horaAtual < close`.
  - Turno noturno (`open > close`, ex: 18:00 - 02:00):
    - No dia em que iniciou: aberto se `horaAtual >= open`.
    - No dia seguinte: aberto se `horaAtual < close` (referente ao turno noturno da véspera).
  - Turno 24 horas (`open === close`): aberto o dia todo.

### 3.2 Filtragem de Distância e Bounding Box
- Se `maxDistance`, `lat` e `lng` informados:
  - Bounding Box preliminar em latitude e longitude no `where` do Prisma.
  - Refinamento exato via `haversineDistance(lat, lng, r.latitude, r.longitude)`.
  - Atribuição de `distanceInMeters` na resposta do restaurante.

### 3.3 Preservação da Paginação
- Se `openNow` ou `maxDistance` estiverem ativos:
  - Busca candidatos no Prisma com filtros de banco (`where.cuisineType`, `where.city`, `where.search`, `where.priceRange`, `where.rating`, bounding box).
  - Aplica filtros em memória (`haversineDistance <= maxDistance`, `isRestaurantOpen`).
  - Calcula `total = filtrados.length`.
  - Realiza fatia paginada `filtrados.slice(skip, skip + limit)`.
- Se nenhum filtro em memória estiver ativo:
  - Utiliza `prisma.restaurant.findMany({ skip, take, where })` e `prisma.restaurant.count({ where })` diretamente no PostgreSQL.

---

## 4. Interface e Experiência do Usuário (`apps/mobile`)

### 4.1 Componente `FilterModal`
- Implementado como Modal / Bottom Sheet escuro com acessibilidade e animações suaves.
- Seções:
  1. **Faixa de Preço**: Chips selecionáveis para `$`, `$$`, `$$$` (permite múltipla ou única seleção).
  2. **Avaliação Mínima**: Chips com notas (3.0★, 3.5★, 4.0★, 4.5★).
  3. **Distância Máxima**: Chips com distâncias (1 km, 3 km, 5 km, 10 km).
  4. **Aberto Agora**: Switch toggle customizado.
  5. **Rodapé de Ações**: Botão "Limpar" (reseta os filtros do modal) e botão "Aplicar Filtros".
- **Estado de Permissão**:
  - Verifica permissão via `Location.getForegroundPermissionsAsync()`.
  - Se negada, a seção de distância exibe aviso amigável: *"Permissão de localização desativada. Ative nas configurações para filtrar por distância."* e desabilita os chips de distância.

### 4.2 Botão de Filtro com Badge
- Posicionado ao lado da barra de busca ou no cabeçalho das telas `home.tsx` e `buscar.tsx`.
- Badge arredondado com contagem de filtros ativos (ex: `2`).

---

## 5. Estratégia de Testes

1. **Testes Unitários de Contratos**:
   - `listRestaurantsQuerySchema` com `priceRange` simples e múltiplos (`$,$$`).
   - `listRestaurantsQuerySchema` com `minRating` válido e inválido (<1, >5, letras).
   - `listRestaurantsQuerySchema` com `maxDistance` exigindo `lat`/`lng` (rejeitando se ausentes).
   - `listRestaurantsQuerySchema` com `openNow` booleanos e strings.
2. **Testes Unitários do Backend**:
   - `isRestaurantOpen` com horário normal, horário fora do turno, virada de meia-noite (overnight), dia sem expediente, e dados nulos/inválidos.
   - `restaurantService.list` com filtro de `priceRange` isolado e combinado.
   - `restaurantService.list` com filtro de `minRating`.
   - `restaurantService.list` com `maxDistance` e Haversine.
   - `restaurantService.list` com `openNow=true`.
   - `restaurantService.list` combinando todos os filtros.
3. **Verificação de Linter e Monorepo**:
   - `npm run verify` passando 100% sem erros de tipagem ou linter.
