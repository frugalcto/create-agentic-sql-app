# Error Codes — __PROJECT_NAME__

PostgreSQL raises application errors. The API maps them to a standard JSON payload. React displays `displayMessage` from the API error response.

## API error shape

```json
{
  "error": {
    "code": "RELEASE_INVALID_TRANSITION",
    "category": "business_rule",
    "displayMessage": "This release cannot be moved to that status."
  }
}
```

## Error catalog

### PERMISSION_DENIED

| Field | Value |
| --- | --- |
| PostgreSQL error | `PERMISSION_DENIED` |
| SQLSTATE | `P0001` |
| HTTP status | `403` |
| Category | `business_rule` |
| API payload | `{ "error": { "code": "PERMISSION_DENIED", "category": "business_rule", "displayMessage": "You do not have permission to perform this action." } }` |
| UI behavior | Show an error state on the current page. Do not retry automatically. |

### RELEASE_NOT_FOUND

| Field | Value |
| --- | --- |
| PostgreSQL error | `RELEASE_NOT_FOUND` |
| SQLSTATE | `P0001` |
| HTTP status | `404` |
| Category | `business_rule` |
| API payload | `{ "error": { "code": "RELEASE_NOT_FOUND", "category": "business_rule", "displayMessage": "Release not found." } }` |
| UI behavior | Show a not-found style error state for the dashboard or mutation result. |

### RELEASE_INVALID_TRANSITION

| Field | Value |
| --- | --- |
| PostgreSQL error | `RELEASE_INVALID_TRANSITION` |
| SQLSTATE | `P0001` |
| HTTP status | `400` |
| Category | `business_rule` |
| API payload | `{ "error": { "code": "RELEASE_INVALID_TRANSITION", "category": "business_rule", "displayMessage": "This release cannot be moved to that status." } }` |
| UI behavior | Show the API error message near the transition action. Keep the current dashboard data visible. |

### VALIDATION_FAILED

| Field | Value |
| --- | --- |
| PostgreSQL error | `VALIDATION_FAILED` |
| SQLSTATE | `P0001` |
| HTTP status | `400` |
| Category | `validation` |
| API payload | `{ "error": { "code": "VALIDATION_FAILED", "category": "validation", "displayMessage": "The request failed validation." } }` |
| UI behavior | Show a validation error state. Do not invent field-level messages unless the API returns them. |

### SYSTEM_ERROR

| Field | Value |
| --- | --- |
| PostgreSQL error | `SYSTEM_ERROR` or unmapped database failure |
| SQLSTATE | `P0001` or database default |
| HTTP status | `500` |
| Category | `system` |
| API payload | `{ "error": { "code": "SYSTEM_ERROR", "category": "system", "displayMessage": "Something went wrong." } }` |
| UI behavior | Show a generic error state and avoid exposing internal details. |

## PostgreSQL convention

Known application errors should be raised from stored procedures:

```sql
raise exception 'RELEASE_INVALID_TRANSITION'
  using errcode = 'P0001';
```

Only documented codes in this file may be raised for business behavior.
