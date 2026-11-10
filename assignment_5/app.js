// Use the same host name the page was loaded from, so the session cookie
// is treated as same-site (localhost <-> localhost, 127.0.0.1 <-> 127.0.0.1).
const API_URL = `http://${window.location.hostname || "localhost"}:5005`;

// Every request includes cookies so the server can see our session ID.
function apiFetch(path, options = {}) {
    return fetch(`${API_URL}${path}`, {
        credentials: "include",
        ...options
    });
}


// Element references

const authSection = document.querySelector("#auth-section");
const songsSection = document.querySelector("#songs-section");
const userBar = document.querySelector("#user-bar");
const welcomeText = document.querySelector("#welcome-text");
const logoutButton = document.querySelector("#logout-button");

const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const authMessage = document.querySelector("#auth-message");

const form = document.querySelector("#recommendation-form");
const titleInput = document.querySelector("#title");
const artistInput = document.querySelector("#artist");
const reasonInput = document.querySelector("#reason");
const genreInput = document.querySelector("#genre");

const messagesDiv = document.querySelector("#messages");
const errorMessage = document.querySelector("#error-message");
const submitButton = document.querySelector("#submit_button");

let editingSongId = null;


// View switching

function showLoggedIn(user) {
    welcomeText.textContent = `Signed in as ${user.first_name} ${user.last_name}`;

    authSection.hidden = true;
    userBar.hidden = false;
    songsSection.hidden = false;

    loadSongs();
}


function showLoggedOut(message = "", isError = false) {
    // Remove every trace of the restricted resource from the page.
    messagesDiv.innerHTML = "";
    clearForm();
    editingSongId = null;
    submitButton.textContent = "Post Recommendation";
    errorMessage.textContent = "";

    songsSection.hidden = true;
    userBar.hidden = true;
    authSection.hidden = false;

    showTab("login");
    setAuthMessage(message, isError);
}


function showTab(tab) {
    const isLogin = tab === "login";

    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;

    loginTab.classList.toggle("active", isLogin);
    registerTab.classList.toggle("active", !isLogin);
    loginTab.setAttribute("aria-selected", String(isLogin));
    registerTab.setAttribute("aria-selected", String(!isLogin));

    setAuthMessage("");
}


function setAuthMessage(text, isError = false) {
    authMessage.textContent = text;
    authMessage.className = text ? (isError ? "error" : "success") : "";
}


loginTab.addEventListener("click", () => showTab("login"));
registerTab.addEventListener("click", () => showTab("register"));


// Registration

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.querySelector("#register-password").value;
    const confirm = document.querySelector("#register-confirm").value;

    if (password !== confirm) {
        setAuthMessage("Passwords do not match.", true);
        return;
    }

    const newUser = {
        first_name: document.querySelector("#register-first-name").value.trim(),
        last_name: document.querySelector("#register-last-name").value.trim(),
        email: document.querySelector("#register-email").value.trim(),
        password: password
    };

    try {
        const response = await apiFetch("/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser)
        });

        if (response.status === 201) {
            const user = await response.json();

            registerForm.reset();
            showTab("login");
            document.querySelector("#login-email").value = user.email;
            document.querySelector("#login-password").focus();

            setAuthMessage(
                `Welcome, ${user.first_name}! Your account was created. Please log in.`
            );
        } else {
            // e.g. 422 "An account with that email already exists."
            setAuthMessage(await response.text(), true);
        }

    } catch (error) {
        setAuthMessage("Could not connect to the server.", true);
    }
});


// Login / logout

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const credentials = {
        email: document.querySelector("#login-email").value.trim(),
        password: document.querySelector("#login-password").value
    };

    try {
        const response = await apiFetch("/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials)
        });

        if (response.status === 201) {
            const user = await response.json();
            loginForm.reset();
            showLoggedIn(user);
        } else if (response.status === 401) {
            setAuthMessage("Login failed: invalid email or password.", true);
            document.querySelector("#login-password").value = "";
        } else {
            setAuthMessage(await response.text(), true);
        }

    } catch (error) {
        setAuthMessage("Could not connect to the server.", true);
    }
});


logoutButton.addEventListener("click", async () => {
    try {
        await apiFetch("/sessions", { method: "DELETE" });
    } catch (error) {
        // Even if the server is unreachable, hide the restricted UI.
    }

    showLoggedOut("You have been logged out.");
});


// When any songs request comes back 401, the session is gone
function handleUnauthorized() {
    showLoggedOut("Your session has ended. Please log in again.", true);
}


// Songs (restricted)

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorMessage.textContent = "";

    const selectedRating =
        document.querySelector('input[name="rating"]:checked');

    if (!selectedRating) {
        errorMessage.textContent = "Please select a rating.";
        return;
    }

    const song = {
        title: titleInput.value.trim(),
        artist: artistInput.value.trim(),
        reason: reasonInput.value.trim(),
        genre: genreInput.value.trim(),
        rating: Number(selectedRating.value)
    };

    let path = "/songs";
    let method = "POST";

    if (editingSongId !== null) {
        path = `/songs/${editingSongId}`;
        method = "PUT";
    }

    try {
        const response = await apiFetch(path, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(song)
        });

        if (response.ok) {
            clearForm();
            editingSongId = null;
            submitButton.textContent = "Post Recommendation";
            loadSongs();
        } else if (response.status === 401) {
            handleUnauthorized();
        } else {
            errorMessage.textContent = "Could not save the recommendation.";
        }

    } catch (error) {
        errorMessage.textContent = "Could not connect to the server.";
    }
});


async function loadSongs() {
    try {
        const response = await apiFetch("/songs");

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            errorMessage.textContent = "Could not load recommendations.";
            return;
        }

        const songs = await response.json();

        messagesDiv.innerHTML = "";

        if (songs.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-note";
            empty.textContent = "No recommendations yet — post the first one!";
            messagesDiv.appendChild(empty);
            return;
        }

        songs.forEach((song) => {
            messagesDiv.appendChild(buildSongCard(song));
        });

    } catch (error) {
        errorMessage.textContent = "Could not connect to the server.";
    }
}


function buildSongCard(song) {
    const card = document.createElement("div");
    card.className = "message-card";

    const titleElement = document.createElement("h3");
    titleElement.textContent = `Title: ${song.title}`;

    const artistElement = document.createElement("p");
    artistElement.className = "artist";
    artistElement.textContent = `Artist: ${song.artist}`;

    const reasonElement = document.createElement("p");
    reasonElement.className = "reason";
    reasonElement.textContent = `Reason: ${song.reason}`;

    const genreElement = document.createElement("p");
    genreElement.textContent = `Genre: ${song.genre}`;

    const ratingElement = document.createElement("p");
    const fullStars = "★".repeat(song.rating);
    const emptyStars = "☆".repeat(5 - song.rating);
    ratingElement.textContent = `Rating: ${fullStars}${emptyStars}`;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "card-buttons";


    // EDIT BUTTON
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.className = "edit-button";

    editButton.addEventListener("click", () => {
        editingSongId = song.id;

        titleInput.value = song.title;
        artistInput.value = song.artist;
        reasonInput.value = song.reason;
        genreInput.value = song.genre;

        const ratingRadio = document.querySelector(
            `input[name="rating"][value="${song.rating}"]`
        );

        if (ratingRadio) {
            ratingRadio.checked = true;
        }

        submitButton.textContent = "Update Recommendation";

        window.scrollTo({ top: 0, behavior: "smooth" });
    });


    // DELETE BUTTON
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";

    deleteButton.addEventListener("click", async () => {
        const confirmed = confirm(`Delete "${song.title}" by ${song.artist}?`);

        if (!confirmed) {
            return;
        }

        try {
            const response = await apiFetch(`/songs/${song.id}`, {
                method: "DELETE"
            });

            if (response.ok) {
                if (editingSongId === song.id) {
                    editingSongId = null;
                    clearForm();
                    submitButton.textContent = "Post Recommendation";
                }

                loadSongs();
            } else if (response.status === 401) {
                handleUnauthorized();
            } else {
                errorMessage.textContent = "Could not delete the recommendation.";
            }

        } catch (error) {
            errorMessage.textContent = "Could not connect to the server.";
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

    return card;
}


function clearForm() {
    form.reset();
}


// Startup

// Ask the server whether this browser already has a logged-in session.
async function checkSession() {
    try {
        const response = await apiFetch("/sessions");

        if (response.ok) {
            const user = await response.json();
            showLoggedIn(user);
        } else {
            showLoggedOut();
        }

    } catch (error) {
        showLoggedOut("Could not connect to the server.", true);
    }
}


checkSession();
