import flask
from song_database import SongDatabase

app = flask.Flask(__name__)

database = SongDatabase("songs.db")


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/songs", methods=["GET"])
def get_songs():
    songs = database.get_all()
    return flask.jsonify(songs)


@app.route("/songs", methods=["POST"])
def create_song():
    data = flask.request.get_json()

    if data is None:
        return "Request body must contain JSON.", 400

    required_fields = ["title", "artist", "reason", "genre", "rating"]

    for field in required_fields:
        if field not in data:
            return f"Missing required field: {field}", 400

    if not isinstance(data["rating"], int):
        return "Rating must be an integer.", 400

    if data["rating"] < 1 or data["rating"] > 5:
        return "Rating must be between 1 and 5.", 400

    title = data["title"]
    artist = data["artist"]
    reason = data["reason"]
    genre = data["genre"]
    rating = data["rating"]

    song = database.create(
        title,
        artist,
        reason,
        genre,
        rating
    )

    return flask.jsonify(song), 201


@app.route("/songs/<int:song_id>", methods=["GET"])
def get_song(song_id):
    song = database.get_one(song_id)

    if song is None:
        return "Song not found", 404

    return flask.jsonify(song)


@app.route("/songs/<int:song_id>", methods=["PUT"])
def replace_song(song_id):
    data = flask.request.get_json()

    if data is None:
        return "Request body must contain JSON.", 400

    required_fields = ["title", "artist", "reason", "genre", "rating"]

    for field in required_fields:
        if field not in data:
            return f"Missing required field: {field}", 400

    if not isinstance(data["rating"], int):
        return "Rating must be an integer.", 400

    if data["rating"] < 1 or data["rating"] > 5:
        return "Rating must be between 1 and 5.", 400

    title = data["title"]
    artist = data["artist"]
    reason = data["reason"]
    genre = data["genre"]
    rating = data["rating"]

    song = database.replace(
        song_id,
        title,
        artist,
        reason,
        genre,
        rating
    )

    if song is None:
        return "Song not found", 404

    return flask.jsonify(song), 200


@app.route("/songs/<int:song_id>", methods=["DELETE"])
def delete_song(song_id):
    deleted = database.delete(song_id)
    if not deleted:
        return "Song not found", 404
    return "", 204


@app.route("/songs", methods=["OPTIONS"])
def options_songs():
    return "", 204


@app.route("/songs/<int:song_id>", methods=["OPTIONS"])
def options_song(song_id):
    return "", 204


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