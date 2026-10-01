const form = document.querySelector("#recommendation-form");
const titleInput = document.querySelector("#title");
const artistInput = document.querySelector("#artist");
const reasonInput = document.querySelector("#reason");
const messagesDiv = document.querySelector("#messages");
const errorMessage = document.querySelector("#error-message");


form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorMessage.textContent = "";

    const title = titleInput.value.trim();
    const artist = artistInput.value.trim();
    const reason = reasonInput.value.trim();

    const note = `${title} - ${artist} | ${reason}`;

    const formData = new FormData();
    formData.append("text", note);

    try {
        const response = await fetch("http://localhost:5005/messages", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            titleInput.value = "";
            artistInput.value = "";
            reasonInput.value = "";

            loadMessages();
        } else {
            errorMessage.textContent = "Could not save the recommendation.";
        }

    } catch (error) {
        errorMessage.textContent = "Could not connect to the server.";
    }
});


async function loadMessages() {
    try {
        const response = await fetch("http://localhost:5005/messages");

        if (!response.ok) {
            errorMessage.textContent = "Could not load recommendations.";
            return;
        }

        const messages = await response.json();

        messagesDiv.innerHTML = "";

        messages.forEach((message) => {
            const [songAndArtist, reason = ""] = message.split(" | ");
            const [title, artist = ""] = songAndArtist.split(" - ");

            const card = document.createElement("div");
            card.className = "message-card";

            const titleElement = document.createElement("h3");
            titleElement.textContent = title;

            const artistElement = document.createElement("p");
            artistElement.className = "artist";
            artistElement.textContent = artist;

            const reasonElement = document.createElement("p");
            reasonElement.className = "reason";
            reasonElement.textContent = reason;

            card.appendChild(titleElement);
            card.appendChild(artistElement);
            card.appendChild(reasonElement);

            messagesDiv.appendChild(card);
        });

    } catch (error) {
        errorMessage.textContent = "Could not connect to the server.";
    }
}


loadMessages();