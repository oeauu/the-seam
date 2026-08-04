---
name: expo-mobile
description: Strict coding rules and mobile UX constraints for Expo, React Native, and cross-platform mobile apps. Use this for quick mobile App development (MVP, tools, login, maps, camera, chat, API interfaces) to prevent web-only APIs and unstructured RN code.
---

# Expo / React Native Skill: Mobile App Development

## Default Stack
- Expo + React Native + TypeScript
- `.tsx` for screens and components
- Expo Router if the project already uses it, otherwise follow the existing routing structure
- Expo-compatible libraries before introducing native modules
- Avoid ejecting from Expo unless absolutely necessary

## Strict TypeScript Rules
- Do not generate JavaScript files.
- Do not use `any`, `as any`, or `@ts-ignore`.
- Define types for screen params, component props, API responses, form data, and app state.
- If navigation params are uncertain, define them explicitly before using them.
- Do not silence TypeScript errors by casting.

## React Native Rules
- Do not use web-only APIs such as `document`, `window`, `localStorage`, CSS files, or DOM events.
- Use React Native components such as `View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `Image`, `TextInput`.
- Use StyleSheet or the project’s existing styling system.
- Prefer `FlatList` over mapping long lists inside `ScrollView`.
- Handle safe areas, keyboard behavior, loading states, and empty states.
- Keep platform differences explicit with `Platform.select` only when needed.

## Expo Rules
- Prefer Expo modules when available, such as `expo-image-picker`, `expo-location`, `expo-camera`, `expo-secure-store`.
- Do not introduce native packages that require custom native configuration unless necessary.
- If a package may require prebuild/eject, warn before using it.
- Keep the project compatible with Expo Go unless the user explicitly wants a custom dev client.

## Mobile UX Rules
- Design for small screens first.
- Make touch targets large enough.
- Avoid hover-only interactions.
- Handle offline/slow network cases when relevant.
- Avoid excessive nested views and expensive re-renders.
- Use memoization only when there is a clear performance reason.

## Quality Checks
- Check TypeScript errors.
- Check that imports are React Native compatible.
- Check that the code does not accidentally use web-only libraries.
- Explain what file changed and why.
