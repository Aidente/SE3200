# Song Recommendation Wall

## Resource

The resource managed by this application is a Song Recommendation.

Each song recommendation has the following attributes:

- `title` - the title of the song
- `artist` - the artist
- `reason` - why the user recommends the song
- `genre` - the genre of the song
- `rating` - a rating from 1 to 5

Each song has a unique integer `id`.

## Database Schema

```sql
CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    reason TEXT NOT NULL,
    genre TEXT NOT NULL,
    rating INTEGER NOT NULL
);