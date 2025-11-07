# API Documentation

## Endpoints

### GET /api/files

List all files in the system.

**Response:** `200 OK`

```json
[
  {
    "name": "example.pdf",
    "mimeType": "application/pdf",
    "hash": "a3f5c8e9d7b2f4a6c1e8d9b7f4a6c1e8d9b7f4a6",
    "path": "/path/to/storage/a3f5c8e9d7b2f4a6c1e8d9b7f4a6c1e8d9b7f4a6",
    "size": 1048576,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

---

### POST /api/file

Upload a file with raw binary data.

**Request:**

```
Content-Type: {file MIME type}
X-Filename: {original filename}

[Raw binary file content]
```

**Headers:**

| Header | Type | Required |
|--------|------|----------|
| `Content-Type` | string | Yes |
| `X-Filename` | string | Yes |

**Response:** `200 OK`

```json
{
  "name": "example.pdf",
  "mimeType": "application/pdf",
  "hash": "a3f5c8e9d7b2f4a6c1e8d9b7f4a6c1e8d9b7f4a6",
  "path": "/path/to/storage/a3f5c8e9d7b2f4a6c1e8d9b7f4a6c1e8d9b7f4a6",
  "size": 1048576,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**Errors:**

- `400` - Missing X-Filename header
- `400` - Missing Content-Type header
- `409` - File already exists
- `413` - File size exceeds maximum limit

---

### GET /api/file/:hash

Download a file by its hash.

**Parameters:**

| Parameter | Type | Required |
|-----------|------|----------|
| `hash` | string | Yes |

**Response:** `200 OK`

```
Content-Disposition: attachment; filename="original-filename.ext"
Content-Type: {file MIME type}

[Binary file content]
```

**Errors:**

- `400` - Invalid request
- `404` - File not found

---

### DELETE /api/file/:hash

Delete a file by its hash.

**Parameters:**

| Parameter | Type | Required |
|-----------|------|----------|
| `hash` | string | Yes |

**Response:** `200 OK`

```
File deleted
```

**Errors:**

- `400` - Invalid request
- `404` - File not found

---

## Data Models

### BunStoreFile

```typescript
{
  name: string;        // Original filename
  mimeType: string;    // MIME type
  hash: string;        // SHA-256 hash (40 hex characters)
  path: string;        // Path to file on disk
  size: number;        // File size in bytes
  createdAt: string;   // ISO 8601 timestamp
}
```
