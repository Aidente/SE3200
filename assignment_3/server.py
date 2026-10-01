import flask

app = flask.Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


@app.route("/messages", methods=["GET"])
def get_messages():
    messages = []
    with open("messages.txt", "r", encoding="utf-8") as file:
        for line in file:
            messages.append(line.strip())
    return flask.jsonify(messages)


@app.route("/messages", methods=["POST"])
def post_message():

    text = flask.request.form.get("text", "").strip()

    with open("messages.txt", "a", encoding="utf-8") as file:
        file.write(text + "\n")

    return "", 201

@app.errorhandler(404)
def not_found(error):
    return "404 Not Found: The requested resource does not exist.", 404


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5005,
        debug=False,
        use_reloader=False,
        threaded=True
    )