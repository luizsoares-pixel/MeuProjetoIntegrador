---
name: frontend-patterns-ecc
description: Frontend and mobile UI patterns, component composition, state management, and React Native / Expo best practices.
source: https://github.com/affaan-m/ECC
license: MIT
---

# Frontend & Mobile Patterns (ECC Standard)

Best practices for React Native, React 19, Expo Router, and mobile UI engineering in `apps/mobile`.

## Core Mobile Guidelines

1. **SafeArea Context**:
   - Wrap screens in `SafeAreaView` from `react-native-safe-area-context` with appropriate edge insets.
   - Avoid hardcoded paddings that clip on notches or dynamic islands.

2. **Styling & Design System**:
   - Always use `StyleSheet.create` for predictable style definitions.
   - Consume design tokens from `theme/` (colors, typography, spacing). Avoid raw magic numbers or random hex values.

3. **Platform-Safe Imports**:
   - Never directly import native modules that break web builds (e.g. `react-native-maps`).
   - Use dynamic conditional requiring:
     ```typescript
     if (Platform.OS !== "web") {
       const Maps = require("react-native-maps");
     }
     ```

4. **Component Decomposition**:
   - Keep route screens concise, delegating specialized sections (e.g. PhotoGallery, OperatingHours, PaymentChips) to modular components.
   - Separate data fetching hooks from visual presentation.
