import secrets


class SessionStore:
    """A basic in-memory session store.

    Maps a random session ID (sent to the browser in a cookie) to a small
    dictionary of session data. Everything lives in memory, so all sessions
    are cleared when the server restarts.
    """

    def __init__(self):
        self.sessions = {}


    def create_session(self):
        # 32 random bytes, URL-safe -> not guessable
        session_id = secrets.token_urlsafe(32)
        self.sessions[session_id] = {}
        return session_id


    def get_session(self, session_id):
        if session_id is None:
            return None

        return self.sessions.get(session_id)


    def delete_session(self, session_id):
        if session_id in self.sessions:
            del self.sessions[session_id]
