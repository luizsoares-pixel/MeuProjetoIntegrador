---
name: ui-ux-pro-max
description: >
  Design intelligence for building professional UI/UX. Provides searchable
  databases of UI styles, color palettes, font pairings, UX guidelines, and
  React Native-specific patterns. Use when designing screens, components, or
  reviewing any visual/interaction decision in apps/mobile.
source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
license: MIT
version: 2.13.0
---

# UI/UX Pro Max — Menu Digital Integration

Design intelligence adaptada para o stack **React Native + Expo (apps/mobile)**.

> **Base de dados local:** `.agents/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/data/`
> **Script de busca:** `python .agents/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/scripts/search.py`
> **Atalho npm:** `npm run design:search -- "<query>" --domain <domain>`

---

## Quando usar este skill

Ative este skill **antes** de qualquer tarefa de front-end mobile:

- Criar ou refatorar componentes visuais
- Escolher paleta de cores, tipografia ou espaçamento
- Revisar acessibilidade de telas
- Implementar animações e microinterações
- Avaliar anti-patterns de UX

---

## Loop de Design (seguir em ordem)

### 1. BUSCAR nos dados
Antes de escrever qualquer linha de código visual, rode o script de busca:

```powershell
# Estilo visual geral para apps de restaurante/luxo
npm run design:search -- "dark luxury restaurant" --domain style

# Paleta de cores para food apps
npm run design:search -- "restaurant food service" --domain color

# Tipografia para premium mobile
npm run design:search -- "premium restaurant mobile" --domain typography

# Diretrizes UX nativas iOS/Android (mais importantes!)
npm run design:search -- "<feature>" --domain web

# Guidelines específicas React Native
npm run design:search -- "<component>" --stack react-native

# Anti-patterns a evitar
npm run design:search -- "<feature>" --domain ux
```

### 2. DECIDIR a estética
O nosso tema é **Dark Luxury Premium** (vermelho escuro `#2f0000` + ouro `#d4af37`).
- Estilo base: **Skeuomorphism** + **Dark Premium** (do `styles.csv`)
- Antes de criar qualquer componente, responder: *propósito, tom, restrições, diferenciador*
- Gastar ousadia em **um** elemento de destaque; manter o resto sóbrio

### 3. IMPLEMENTAR com tokens
- Sempre consumir tokens de `apps/mobile/theme/` (colors, typography, spacing, animations)
- NUNCA usar valores mágicos (`#d4af37` no componente — use `colors.accent.gold`)
- Usar `StyleSheet.create` para todos os estilos

### 4. VERIFICAR acessibilidade
Após implementar, checar obrigatoriamente:
- `accessibilityLabel` em botões de ícone
- `accessibilityRole` em elementos interativos
- Touch targets ≥ 44pt iOS / 48dp Android
- Ícones decorativos com `accessible={false}`
- Labels visíveis em todos os campos de input

---

## Domínios Disponíveis

| Flag | CSV | Uso para nós |
|---|---|---|
| `--domain style` | `styles.csv` | Escolher estilo visual (luxury, glass, etc.) |
| `--domain color` | `colors.csv` | Paletas por tipo de produto |
| `--domain typography` | `typography.csv` | Font pairings React Native |
| `--domain ux` | `ux-guidelines.csv` | Anti-patterns e boas práticas |
| `--domain web` | `app-interface.csv` | Diretrizes nativas iOS/Android |
| `--domain react` | `react-performance.csv` | Padrões de performance RN |
| `--domain icons` | `icons.csv` | Recomendações de iconografia |
| `--stack react-native` | `stacks/react-native.csv` | Padrões específicos para RN |

---

## Referências do Projeto

- **Tema atual:** [`apps/mobile/theme/`](../../../apps/mobile/theme/)
- **Componentes:** [`apps/mobile/components/`](../../../apps/mobile/components/)
- **Telas:** [`apps/mobile/app/`](../../../apps/mobile/app/)
- **Dados brutos:** [`.agents/skills/ui-ux-pro-max-skill/src/ui-ux-pro-max/data/`](./ui-ux-pro-max-skill/src/ui-ux-pro-max/data/)

---

## Checklist antes de declarar UI pronta

- [ ] Script de busca consultado para o domínio relevante
- [ ] Tokens do `theme/` usados (sem valores hardcoded)
- [ ] Touch targets verificados (44pt/48dp)
- [ ] `accessibilityLabel` em todos os botões de ícone
- [ ] Ícones decorativos marcados como `accessible={false}`
- [ ] Labels visíveis em campos de formulário
- [ ] Estado de loading/empty/error implementado
- [ ] Animações dentro dos limites de `animations.duration`
