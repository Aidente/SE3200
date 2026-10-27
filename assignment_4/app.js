const form = document.querySelector("#recommendation-form");

const titleInput = document.querySelector("#title");
const artistInput = document.querySelector("#artist");
const reasonInput = document.querySelector("#reason");
const genreInput = document.querySelector("#genre");

const messagesDiv = document.querySelector("#messages");
const errorMessage = document.querySelector("#error-message");
const submitButton = document.querySelector("#submit_button");

let editingSongId = null;


form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorMessage.textContent = "";

    const title = titleInput.value.trim();
    const artist = artistInput.value.trim();
    const reason = reasonInput.value.trim();
    const genre = genreInput.value.trim();

    const selectedRating =
        document.querySelector('input[name="rating"]:checked');

    if (!selectedRating) {
        errorMessage.textContent = "Please select a rating.";
        return;
    }

    const rating = Number(selectedRating.value);

    const song = {
        title: title,
        artist: artist,
        reason: reason,
        genre: genre,
        rating: rating
    };

    let url = "http://localhost:5005/songs";
    let method = "POST";

    if (editingSongId !== null) {
        url = `http://localhost:5005/songs/${editingSongId}`;
        method = "PUT";
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(song)
        });

        if (response.ok) {
            clearForm();

            editingSongId = null;

            submitButton.textContent = "Post Recommendation";

            loadSongs();
        } else {
            errorMessage.textContent =
                "Could not save the recommendation.";
        }

    } catch (error) {
        errorMessage.textContent =
            "Could not connect to the server.";
    }
});


async function loadSongs() {
    try {
        const response =
            await fetch("http://localhost:5005/songs");

        if (!response.ok) {
            errorMessage.textContent =
                "Could not load recommendations.";
            return;
        }

        const songs = await response.json();

        messagesDiv.innerHTML = "";

        songs.forEach((song) => {
            const card = document.createElement("div");
            card.className = "message-card";

            const titleElement = document.createElement("h3");
            titleElement.textContent =
                `Title: ${song.title}`;

            const artistElement = document.createElement("p");
            artistElement.className = "artist";
            artistElement.textContent =
                `Artist: ${song.artist}`;

            const reasonElement = document.createElement("p");
            reasonElement.className = "reason";
            reasonElement.textContent =
                `Reason: ${song.reason}`;

            const genreElement = document.createElement("p");
            genreElement.textContent =
                `Genre: ${song.genre}`;

            const ratingElement = document.createElement("p");

            const fullStars = "★".repeat(song.rating);
            const emptyStars = "☆".repeat(5 - song.rating);

            ratingElement.textContent =
                `Rating: ${fullStars}${emptyStars}`;

            const buttonContainer =
                document.createElement("div");

            buttonContainer.className = "card-buttons";


            // EDIT BUTTON
            const editButton =
                document.createElement("button");

            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.className = "edit-button";

            editButton.addEventListener("click", () => {
                editingSongId = song.id;

                titleInput.value = song.title;
                artistInput.value = song.artist;
                reasonInput.value = song.reason;
                genreInput.value = song.genre;

                const ratingRadio =
                    document.querySelector(
                        `input[name="rating"][value="${song.rating}"]`
                    );

                if (ratingRadio) {
                    ratingRadio.checked = true;
                }

                submitButton.textContent =
                    "Update Recommendation";

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            });


            // DELETE BUTTON
            const deleteButton =
                document.createElement("button");

            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-button";

            deleteButton.addEventListener("click", async () => {
                console.log("Delete clicked");
                console.log("Deleting song:", song);
                console.log("Song ID:", song.id);

                const confirmed = confirm(
                    `Delete "${song.title}" by ${song.artist}?`
                );

                console.log("Confirmed:", confirmed);

                if (!confirmed) {
                    return;
                }

                try {
                    const response = await fetch(
                        `http://localhost:5005/songs/${song.id}`,
                        {
                            method: "DELETE"
                        }
                    );

                    console.log(
                        "Delete status:",
                        response.status
                    );

                    if (response.ok) {
                        if (editingSongId === song.id) {
                            editingSongId = null;

                            clearForm();

                            submitButton.textContent =
                                "Post Recommendation";
                        }

                        loadSongs();
                    } else {
                        errorMessage.textContent =
                            "Could not delete the recommendation.";
                    }

                } catch (error) {
                    console.error(error);

                    errorMessage.textContent =
                        "Could not connect to the server.";
                }
            });


            buttonContainer.appendChild(editButton);
            buttonContainer.appendChild(deleteButton);

            card.appendChild(titleElement);
            card.appendChild(artistElement);
            card.appendChild(reasonElement);
            card.appendChild(genreElement);
            card.appendChild(ratingElement);
            card.appendChild(buttonContainer);

            messagesDiv.appendChild(card);
        });

    } catch (error) {
        errorMessage.textContent =
            "Could not connect to the server.";
    }
}


function clearForm() {
    titleInput.value = "";
    artistInput.value = "";
    reasonInput.value = "";
    genreInput.value = "";

    document
        .querySelectorAll('input[name="rating"]')
        .forEach((radio) => {
            radio.checked = false;
        });
}


loadSongs();