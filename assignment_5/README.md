# Song Recommendation Wall

- **Server** Python / Flask (`server.py`). SQLite database (`songs.db`)
- **Client** HTML, CSS and JS (`index.HTML`, `style.CSS`, `app.js`). All requests to the server are done with Ajax (`fetch`).

## Setup

Start the API server on port 5005:

```bash
python3 server.py
```

Then serve the client files with a local web server (cannot GET cookies from `file://`):

```bash
python3 -m http.server 8000
```

Navigate to <http://localhost:8000> in your browser.

> As requests to the API are made on the same host name (`localhost`/`127.0.0.1`) that the page was loaded from, the session cookie will be sent.

## Models

### User

Represents a registered user.

| Attribute | Type | Description |
|---|---|---|
| `ID` | integer | Unique Identifier (Primary Key) |
| `first_name` | text | First name of user |
| `last_name` | text | Last name of user |
| `email` | text | Email address of user (must be unique) |
| `encrypted_password` | text | Password stored as a hash (not returned by API) |

### Song Recommendation (Protected)

Represents a recommended song. Songs can only be read or managed by authenticated users.

| Attribute | Type | Description |
|---|---|---|
| `ID` | integer | Unique Identifier (Primary Key) |
| `title` | text | Title of song |
| `artist` | text | Artist |
| `reason` | text | Reason for recommendation |
| `genre` | text | Genre of song |
| `rating` | integer | Rating between 1-5 |

## Database Structure

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    encrypted_password TEXT NOT NULL
);

CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    reason TEXT NOT NULL,
    genre TEXT NOT NULL,
    rating INTEGER NOT NULL
);
```

## Endpoints

| Endpoint | Method | Route | Auth Required | Success | Status Codes |
|---|---|---|:---:|---|---|
| Register User | `POST` | `/users` | No | 201 Created | 400, 422 (Email Taken) |
| Login | `POST` | `/sessions` | No | 201 Created | 400, 401 |
| Current Session | `GET` | `/sessions` | Yes | 200 OK | 401 |
| Logout | `DELETE` | `/sessions` | No | 204 No Content | - |
| Songs | `GET` | `/songs` | Yes | 200 OK | 401 |
| Add Song | `POST` | `/songs` | Yes | 201 Created | 400, 401 |
| Get Song | `GET` | `/songs/<id>` | Yes | 200 OK | 401, 404 |
| Update Song | `PUT` | `/songs/<id>` | Yes | 200 OK | 400, 401, 404 |
| Remove Song | `DELETE` | `/songs/<id>` | Yes | 204 No Content | 401, 404 |

### Requests/Responses

**`POST /users`.** A `POST` request to the `/users` endpoint. Body: `{"first_name", "last_name", "email", "password"}`. Server checks the email is unique, if not it returns a `422 Unprocessable Entity` status code with a message *"An account with that email already exists."* This will be shown on the client. If successful it will return the new user (with no password) and a `Location` header.

**`POST /sessions`.** A `POST` request to the `/sessions` endpoint. Body: `{"email", "password"}`. If no user was found with the given email or the password does not match the stored hash, return a `401 Unauthorized`. If successful return a `201 Created` with the basic user information:

```json
{ "ID": 1, "first_name": "Aiden", "last_name": "T", "email": "a@x.com" }
```

And set the session cookie.

All requests to endpoints starting with `/songs` will return a `401 Unauthorized` if there is no valid session.

## Session

- A simple in memory session system has been created in `session_store.py`. This is a dictionary where the keys are random session IDs (`secrets.token_urlsafe(32)`) and the values are session data.
- When the user logs in successfully, any existing sessions will be removed. A new session will then be created with just the `user_id` stored.
- The session ID will then be sent back to the browser as a cookie called `session_id`. This cookie has the `HttpOnly`, `SameSite=Lax` and `Path=/` flags set.
- The client includes cookies in all requests (`credentials: "include"`), this means the server adds CORS headers to match the `Origin` of the request, and sets `Access-Control-Allow-Credentials: true`. (If there is an origin with credentials.)
- When the user logs out their session is removed, and the cookie expires. All sessions will also be lost when the server is restarted.

## Authentication

- **Server** All endpoints under `/songs` check there is a valid session. If not return `401`.
- **Client** The song form and list are hidden (empty) until the user logs in. When the page loads it makes a `GET` request to `/sessions` to show the logged in view. If any requests to songs return a `401` status code, the songs will be cleared and the user will be shown the login screen.

## Password Hashing

Passwords are hashed using the scrypt algorithm. Using the `generate_password_hash` function from Werkzeug (installed with flask). Passwords can be checked with `check_password_hash`.

| Parameter | Value |
|---|---|
| Algorithm | scrypt |
| CPU/Memory Cost (N) | 32768 (2¹⁵) |
| Block Size (r) | 8 |
| Parallelism (p) | 1 |
| Salt | 16 random characters (unique to user) |
| Storage Format | `scrypt:32768:8:1$<salt>$<hash>` |

The password will never be stored in clear text. It is deleted immediately after being hashed.
