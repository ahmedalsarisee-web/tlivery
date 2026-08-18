# Wasel Mobile Architecture

Wasel uses feature-based presentation with clean data and domain boundaries.

```text
src/
├── api/                 # Non-Firebase HTTP/API transport
├── firebase/            # Native Firebase adapters
│   ├── auth/
│   ├── firestore/
│   ├── storage/
│   ├── functions/
│   └── notifications/
├── services/            # Application use cases and orchestration
├── repositories/        # Domain-facing data contracts and implementations
├── models/              # Domain entities
├── hooks/               # UI-facing React and React Query hooks
├── features/            # Screens and feature-specific presentation
├── store/               # Client-only application state
├── types/               # Cross-cutting TypeScript types
├── utils/               # Pure reusable utilities
└── constants/           # Immutable application constants
```

## Dependency direction

```text
features/hooks → services → repositories → firebase/api
                       ↓
                     models
```

- Screens render state and dispatch actions; they contain no data-access logic.
- Hooks expose query and mutation state to screens.
- Services implement use cases and coordinate repositories.
- Repositories hide Firebase and HTTP implementation details.
- Firebase adapters are the only layer that imports React Native Firebase SDKs.
- Models and repository contracts remain independent of Firebase document types.
- Zustand stores transient client UI/session state; server state belongs to
  React Query. Firebase Auth remains the durable session authority.

## Error and data rules

- Convert Firebase errors into typed application errors at the adapter boundary.
- Convert Firestore timestamps and document snapshots before returning models.
- Never expose credentials, raw SDK snapshots, or platform-specific objects to screens.
- Validate writes at service boundaries and enforce authorization again in Security Rules.
