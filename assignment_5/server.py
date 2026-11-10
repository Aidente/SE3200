import flask
from werkzeug.security import generate_password_hash, check_password_hash

from song_database import SongDatabase
from user_database import UserDatabase
from session_store import SessionStore

app = flask.Flask(__name__)

song_database = SongDatabase("songs.db")
user_database = UserDatabase("songs.db")
session_store = SessionStore()

SESSION_COOKIE = "session_id"

# Password hashing: scrypt (N=2^15, r=8, p=1) with a 16-character random salt.
PASSWORD_HASH_METHOD = "scrypt:32768:8:1"
PASSWORD_SALT_LENGTH = 16


# CORS

@app.after_request
def add_cors_headers(response):
    # Cookies are only sent cross-origin when the server echoes the exact
    # origin (not "*") and allows credentials.
    origin = flask.request.headers.get("Origin")

    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"

    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


# Session helpers

def get_current_session():
    session_id = flask.request.cookies.get(SESSION_COOKIE)
    return session_store.get_session(session_id)


def get_current_user():
    session = get_current_session()

    if session is None or "user_id" not in session:
        return None

    return user_database.get_one(session["user_id"])


def is_authenticated():
    return get_current_user() is not None


def unauthorized():
    return "401 Unauthorized: You must be logged in to access this resource.", 401


# Users (registration)

@app.route("/users", methods=["POST"])
def create_user():
    data = flask.request.get_json(silent=True)

    if data is None:
        return "Request body must contain JSON.", 400

    required_fields = ["first_name", "last_name", "email", "password"]

    for field in required_fields:
        if not isinstance(data.get(field), str) or data[field].strip() == "":
            return f"Missing required field: {field}", 400

    first_name = data["first_name"].strip()
    last_name = data["last_name"].strip()
    email = data["email"].strip().lower()
    password = data["password"]

    if "@" not in email or "." not in email.split("@")[-1]:
        return "Please enter a valid email address.", 422

    if len(password) < 8:
        return "Password must be at least 8 characters.", 422

    if user_database.email_exists(email):
        return "An account with that email already exists.", 422

    encrypted_password = generate_password_hash(
        password,
        method=PASSWORD_HASH_METHOD,
        salt_length=PASSWORD_SALT_LENGTH
    )

    # The plain-text password is discarded here; only the hash is stored.
    del password
    del data["password"]

    user = user_database.create(first_name, last_name, email, encrypted_password)

    if user is None:
        # Another request registered the same email at the same moment.
        return "An account with that email already exists.", 422

    response = flask.jsonify(user)
    response.status_code = 201
    response.headers["Location"] = f"/users/{user['id']}"
    return response


# Sessions (authentication)

@app.route("/sessions", methods=["POST"])
def create_session():
    data = flask.request.get_json(silent=True)

    if data is None:
        return "Request body must contain JSON.", 400

    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        return "Email and password are required.", 400

    user, encrypted_password = user_database.get_login_record(email.strip().lower())

    if user is None or not check_password_hash(encrypted_password, password):
        return "Invalid email or password.", 401

    # Throw away any previous session and issue a fresh ID
    # (prevents session fixation).
    old_session_id = flask.request.cookies.get(SESSION_COOKIE)
    session_store.delete_session(old_session_id)

    session_id = session_store.create_session()
    session_store.get_session(session_id)["user_id"] = user["id"]

    response = flask.jsonify(user)
    response.status_code = 201
    response.set_cookie(
        SESSION_COOKIE,
        session_id,
        httponly=True,
        samesite="Lax",
        path="/"
    )
    return response


@app.route("/sessions", methods=["GET"])
def get_session():
    # Lets the client find out whether it is already logged in.
    user = get_current_user()

    if user is None:
        return unauthorized()

    return flask.jsonify(user)


@app.route("/sessions", methods=["DELETE"])
def delete_session():
    session_id = flask.request.cookies.get(SESSION_COOKIE)
    session_store.delete_session(session_id)

    response = flask.make_response("", 204)
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, samesite="Lax")
    return response


# Songs (restricted to authenticated users)

def validate_song(data):
    # Returns an error message, or None if the song data is valid.
    if data is None:
        return "Request body must contain JSON."

    for field in ["title", "artist", "reason", "genre"]:
        if not isinstance(data.get(field), str) or data[field].strip() == "":
            return f"Missing required field: {field}"

    rating = data.get("rating")

    if not isinstance(rating, int) or isinstance(rating, bool):
        return "Rating must be an integer."

    if rating < 1 or rating > 5:
        return "Rating must be between 1 and 5."

    return None


@app.route("/songs", methods=["GET"])
def get_songs():
    if not is_authenticated():
        return unauthorized()

    songs = song_database.get_all()
    return flask.jsonify(songs)


@app.route("/songs", methods=["POST"])
def create_song():
    if not is_authenticated():
        return unauthorized()

    data = flask.request.get_json(silent=True)
    error = validate_song(data)

    if error:
        return error, 400

    song = song_database.create(
        data["title"].strip(),
        data["artist"].strip(),
        data["reason"].strip(),
        data["genre"].strip(),
        data["rating"]
    )

    response = flask.jsonify(song)
    response.status_code = 201
    response.headers["Location"] = f"/songs/{song['id']}"
    return response


@app.route("/songs/<int:song_id>", methods=["GET"])
def get_song(song_id):
    if not is_authenticated():
        return unauthorized()

    song = song_database.get_one(song_id)

    if song is None:
        return "Song not found", 404

    return flask.jsonify(song)


@app.route("/songs/<int:song_id>", methods=["PUT"])
def replace_song(song_id):
    if not is_authenticated():
        return unauthorized()

    data = flask.request.get_json(silent=True)
    error = validate_song(data)

    if error:
        return error, 400

    song = song_database.replace(
        song_id,
        data["title"].strip(),
        data["artist"].strip(),
        data["reason"].strip(),
        data["genre"].strip(),
        data["rating"]
    )

    if song is None:
        return "Song not found", 404

    return flask.jsonify(song), 200


@app.route("/songs/<int:song_id>", methods=["DELETE"])
def delete_song(song_id):
    if not is_authenticated():
        return unauthorized()

    deleted = song_database.delete(song_id)

    if not deleted:
        return "Song not found", 404

    return "", 204


# CORS preflight

@app.route("/users", methods=["OPTIONS"])
@app.route("/sessions", methods=["OPTIONS"])
@app.route("/songs", methods=["OPTIONS"])
def options_collection():
    return "", 204


@app.route("/songs/<int:song_id>", methods=["OPTIONS"])
def options_song(song_id):
    return "", 204


# Errors

@app.errorhandler(404)
def not_found(error):
    return "404 Not Found: The requested resource does not exist.", 404


@app.errorhandler(405)
def method_not_allowed(error):
    return "405 Method Not Allowed: This method is not supported for this resource.", 405


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5005,
        debug=False,
        use_reloader=False,
        threaded=True
    )
