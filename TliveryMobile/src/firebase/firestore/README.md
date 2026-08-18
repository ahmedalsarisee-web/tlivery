# Firestore

Collection references, converters, transaction helpers, and Firestore-specific
data sources. Raw snapshots and timestamps must not escape this layer.

## Initial collections

### `users/{firebaseAuthUid}`

The document ID is always the Firebase Authentication UID. The profile stores
the application role, account status, and optional company membership. Tokens
and passwords are never stored in Firestore.

### `companies/{companyId}`

Company IDs are generated independently from company codes. Codes are
human-readable identifiers; document IDs remain stable if a code changes.
Members and drivers are not stored as arrays on the company document, avoiding
document-size and concurrent-update limits.

Domain models use JavaScript `Date` values. Firestore converters are responsible
for translating those values to and from native Firestore timestamps.
