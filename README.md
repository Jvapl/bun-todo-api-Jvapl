# Bun Todo API

A minimal REST API for managing todos, built with **Bun**, **TypeScript**, **Valibot** for validation, and **SQLite** for persistence. Designed to connect with a React todo frontend.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/docs/installation) installed (`bun --version` to verify)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bun-todo-api-Jvapl

# Install dependencies
bun install
```

### Environment Variables


| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DB_PATH` | `mydb.sqlite` | SQLite database file path |

### Running the Project

```bash
# Development (auto-reload on file changes)
bun run --watch index.ts

# Production
bun run index.ts
```

Server starts at `http://localhost:3000/`

---

## API Endpoints

All endpoints are prefixed with `/todos`. CORS is enabled for frontend integration.

### Get All Todos

```http
GET /todos
```

---

### Create a Todo

```http
POST /todos
Content-Type: application/json
```

**Request Body**
```json
{
  "title": "Learn Bun",           
  "content": "Build a todo API",  
  "due_date": "2026-10-01",       
  "done": false                  
}
```
---

### Update a Todo (Partial)

```http
PATCH /todos/:id
Content-Type: application/json
```

**Request Body** (all fields optional)
```json
{
  "title": "Learn Bun v2",
  "done": true
}
```


---

### Delete All Todos

```http
DELETE /todos
```

**Response** `204 No Content`

---

## Data Model

### Todo Schema (Valibot)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Auto-generated | Primary key |
| `title` | `string` | Yes | Trimmed, non-empty |
| `content` | `string \| null` | No | Nullable |
| `due_date` | `string \| null` | No | ISO date or timestamp, nullable |
| `done` | `0 \| 1` | No | Stored as integer (0/1), sent as boolean |

### SQLite Table

```sql
create table if not exists todos (
    id integer primary key,
    title text not null,
    content text,
    due_date date,
    done integer default 0
);
```

---

## Project Structure

```
.
├── index.ts                      # Entry point, Bun server + routes
├── package.json
├── tsconfig.json
├── schema.sql                    # Database schema
├── mydb.sqlite                   # SQLite database (auto-created)
├── .env.example                  # Environment template
├── README.md
└── src/
    ├── db.ts                     # Database connection + CORS helpers
    ├── schemas/
    │   └── todo.schema.ts        # Valibot schemas & TypeScript types
    └── services/
        ├── todo.services.ts      # Business logic (CRUD operations)
        └── controllers/
            └── todo.controllers.ts  # HTTP handlers (validation, responses)
```

---

## Usage Examples

### CURL

### 1. Terminal
```bash
# Get all todos
curl http://localhost:3000/todos

# Create a todo
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "New task", "due_date": "2026-12-31", "done": true}'

# Update a todo
curl -X PATCH http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"done": true}'

# Delete a todo
curl -X DELETE http://localhost:3000/todos/1

# Delete all todos
curl -X DELETE http://localhost:3000/todos
```
### 2. React Todo
```
    git clone <https://github.com/Jvapl/react-todos>
    git cd react-todos
```

```
    change url: https:http://localhost:3000
    and dynamic url: '${url}/${id}'
```
---

## Acknowledgements

- [Bun](https://bun.sh/) - Fast JavaScript runtime
- [Valibot](https://valibot.dev/) - Tiny validation library
- [SQLite](https://www.sqlite.org/) - Embedded database