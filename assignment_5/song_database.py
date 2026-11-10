import sqlite3


class SongDatabase:
    def __init__(self, filename):
        self.filename = filename
        self.create_table()


    def connect(self):
        connection = sqlite3.connect(self.filename)
        connection.row_factory = sqlite3.Row
        return connection
    
    def row_to_dict(self, row):
        if row is None:
            return None

        return {
            "id": row["id"],
            "title": row["title"],
            "artist": row["artist"],
            "reason": row["reason"],
            "genre": row["genre"],
            "rating": row["rating"]
        }


    def create_table(self):
        connection = self.connect()

        connection.execute("""
            CREATE TABLE IF NOT EXISTS songs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                reason TEXT NOT NULL,
                genre TEXT NOT NULL,
                rating INTEGER NOT NULL
            )
        """)

        connection.commit()
        connection.close()


    def get_all(self):
        connection = self.connect()

        cursor = connection.execute("""
            SELECT * FROM songs
            ORDER BY id
        """)

        rows = cursor.fetchall()

        songs = []

        for row in rows:
            songs.append(self.row_to_dict(row))

        connection.close()
        return songs


    def get_one(self, song_id):
        connection = self.connect()

        cursor = connection.execute("""
            SELECT * FROM songs
            WHERE id = ?
        """, (song_id,))

        row = cursor.fetchone()

        connection.close()
        return self.row_to_dict(row)


    def create(self, title, artist, reason, genre, rating):
        connection = self.connect()

        cursor = connection.execute("""
            INSERT INTO songs (title, artist, reason, genre, rating)
            VALUES (?, ?, ?, ?, ?)
        """, (title, artist, reason, genre, rating))

        connection.commit()

        song_id = cursor.lastrowid

        connection.close()
        return self.get_one(song_id)



    def replace(self, song_id, title, artist, reason, genre, rating):
        connection = self.connect()

        cursor = connection.execute("""
            UPDATE songs
            SET title = ?,
                artist = ?,
                reason = ?,
                genre = ?,
                rating = ?
            WHERE id = ?
        """, (title, artist, reason, genre, rating, song_id))

        connection.commit()

        if cursor.rowcount == 0:
            connection.close()
            return None

        connection.close()
        return self.get_one(song_id)
    

    def delete(self, song_id):
        connection = self.connect()

        cursor = connection.execute("""
            DELETE FROM songs
            WHERE id = ?
        """, (song_id,))

        connection.commit()

        deleted = cursor.rowcount > 0

        connection.close()

        return deleted