import sqlite3


class UserDatabase:
    def __init__(self, filename):
        self.filename = filename
        self.create_table()


    def connect(self):
        connection = sqlite3.connect(self.filename)
        connection.row_factory = sqlite3.Row
        return connection


    def row_to_dict(self, row):
        # Only public attributes are returned. The password hash never
        # leaves this class except through get_password_hash_by_email().
        if row is None:
            return None

        return {
            "id": row["id"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "email": row["email"]
        }


    def create_table(self):
        connection = self.connect()

        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                encrypted_password TEXT NOT NULL
            )
        """)

        connection.commit()
        connection.close()


    def get_one(self, user_id):
        connection = self.connect()

        cursor = connection.execute("""
            SELECT * FROM users
            WHERE id = ?
        """, (user_id,))

        row = cursor.fetchone()

        connection.close()
        return self.row_to_dict(row)


    def email_exists(self, email):
        connection = self.connect()

        cursor = connection.execute("""
            SELECT id FROM users
            WHERE email = ?
        """, (email,))

        row = cursor.fetchone()

        connection.close()
        return row is not None


    def get_login_record(self, email):
        # Returns (user_dict, encrypted_password) or (None, None).
        connection = self.connect()

        cursor = connection.execute("""
            SELECT * FROM users
            WHERE email = ?
        """, (email,))

        row = cursor.fetchone()

        connection.close()

        if row is None:
            return None, None

        return self.row_to_dict(row), row["encrypted_password"]


    def create(self, first_name, last_name, email, encrypted_password):
        # Returns the new user, or None if the email is already taken.
        connection = self.connect()

        try:
            cursor = connection.execute("""
                INSERT INTO users (first_name, last_name, email, encrypted_password)
                VALUES (?, ?, ?, ?)
            """, (first_name, last_name, email, encrypted_password))

            connection.commit()

        except sqlite3.IntegrityError:
            connection.close()
            return None

        user_id = cursor.lastrowid

        connection.close()
        return self.get_one(user_id)
