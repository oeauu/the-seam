---
name: android-native
description: Developer guidelines and coding constraints for native Android development using Kotlin and Jetpack Compose. Use this when native performance, system APIs, lifecycle, background tasks, or hardware permissions are required to prevent unstructured UI and improper asynchronous Flow usage.
---

# Android Native Skill: Kotlin + Jetpack Compose

## Default Stack
- Kotlin
- Jetpack Compose
- Material 3 if the project uses it
- ViewModel for screen state
- Coroutines and Flow for asynchronous work
- Follow the existing project architecture

## Strict Rules
- Do not write Java unless the existing project is Java-based.
- Do not use XML layouts for new UI unless the project is XML-based.
- Do not put business logic directly inside Composables.
- Do not perform network/database operations inside Composables.
- Do not create global mutable state unless unavoidable.
- Do not use hardcoded strings in production UI if resources are expected.

## Architecture Rules
- Separate UI, state, business logic, and data access.
- Use ViewModel to expose UI state.
- Represent UI state with data classes or sealed interfaces.
- Handle loading, success, empty, and error states explicitly.
- Keep Composables stateless when possible.
- Pass state down and events up.

## Compose Rules
- Use `@Composable` functions only for UI.
- Avoid large Composables with too many responsibilities.
- Use `remember` only for UI-local state.
- Use `rememberSaveable` for state that should survive configuration changes.
- Avoid launching side effects directly in the composition body.
- Use `LaunchedEffect`, `DisposableEffect`, or `derivedStateOf` only when appropriate.
- Keep recomposition in mind; avoid unnecessary object creation in hot UI paths.

## Kotlin Rules
- Prefer immutable data.
- Use nullability deliberately.
- Avoid `!!` unless there is a strong reason.
- Avoid overly broad exception catching.
- Prefer sealed classes/interfaces for finite UI states.
- Prefer clear names over clever abstractions.

## Quality Checks
- Check for lifecycle issues.
- Check for Compose recomposition problems.
- Check for coroutine scope misuse.
- Check whether permissions are declared and requested properly.
- Explain any `AndroidManifest` or Gradle changes.
