const regionSelect = document.querySelector("#regionSelect");
const findTripButton = document.querySelector("#findTripButton");
const tripResult = document.querySelector("#tripResult");


const destinations = {

    europe: [
        {
            name: "London",
            country: "United Kingdom",
            type: "City",
            description: "Explore historic landmarks, museums, markets, and neighborhoods throughout London."
        },
        {
            name: "Paris",
            country: "France",
            type: "City",
            description: "Visit famous landmarks, museums, cafés, and neighborhoods throughout Paris."
        },
        {
            name: "Berlin",
            country: "Germany",
            type: "City",
            description: "Explore Berlin's history, architecture, museums, and nightlife."
        },
        {
            name: "Rome",
            country: "Italy",
            type: "City",
            description: "Experience ancient landmarks, Italian food, museums, and historic streets."
        }
    ],

    asia: [
        {
            name: "Tokyo",
            country: "Japan",
            type: "City",
            description: "Explore neighborhoods, food, technology, shopping, and traditional Japanese culture."
        },
        {
            name: "Shanghai",
            country: "China",
            type: "City",
            description: "Experience a large modern city with historic districts, food, and skyline views."
        },
        {
            name: "Singapore",
            country: "Singapore",
            type: "City",
            description: "Explore gardens, modern architecture, food markets, and waterfront attractions."
        },
        {
            name: "Seoul",
            country: "South Korea",
            type: "City",
            description: "Discover Korean food, historic palaces, shopping districts, and modern city life."
        }
    ],

    americas: [
        {
            name: "Toronto",
            country: "Canada",
            type: "City",
            description: "Explore neighborhoods, food, museums, waterfront attractions, and city landmarks."
        },
        {
            name: "New York",
            country: "United States",
            type: "City",
            description: "Visit famous landmarks, museums, parks, restaurants, and neighborhoods."
        },
        {
            name: "Cancun",
            country: "Mexico",
            type: "City",
            description: "Enjoy beaches, warm weather, nearby historic sites, and coastal activities."
        },
        {
            name: "Rio de Janeiro",
            country: "Brazil",
            type: "City",
            description: "Experience beaches, mountain views, Brazilian culture, and famous landmarks."
        }
    ],

    africa: [
        {
            name: "Cairo",
            country: "Egypt",
            type: "City",
            description: "Explore ancient history, museums, markets, and nearby archaeological sites."
        },
        {
            name: "Lagos",
            country: "Nigeria",
            type: "City",
            description: "Experience Nigerian culture, food, entertainment, beaches, and city life."
        },
        {
            name: "Cape Town",
            country: "South Africa",
            type: "City",
            description: "Explore mountains, beaches, waterfront attractions, and scenic landscapes."
        },
        {
            name: "Casablanca",
            country: "Morocco",
            type: "City",
            description: "Discover Moroccan architecture, food, markets, and Atlantic Ocean views."
        }
    ],

    oceania: [
        {
            name: "Sydney",
            country: "Australia",
            type: "City",
            description: "Explore beaches, the harbor, famous landmarks, and coastal neighborhoods."
        },
        {
            name: "Melbourne",
            country: "Australia",
            type: "City",
            description: "Experience cafés, art, sports, markets, and Melbourne's city neighborhoods."
        },
        {
            name: "Queenstown",
            country: "New Zealand",
            type: "City",
            description: "Enjoy mountain scenery, outdoor adventures, hiking, and lake views."
        },
        {
            name: "Port Moresby",
            country: "Papua New Guinea",
            type: "City",
            description: "Explore local culture, museums, coastal scenery, and nearby nature."
        }
    ]
};


findTripButton.addEventListener("click", function() {

    const selectedRegion = regionSelect.value;

    if (selectedRegion === "choose") {
        tripResult.textContent = "Please choose a region first.";
        return;
    }

    const regionDestinations = destinations[selectedRegion];

    const randomIndex =
        Math.floor(Math.random() * regionDestinations.length);

    const chosenDestination =
        regionDestinations[randomIndex];


    tripResult.textContent = "";


    const destinationHeading =
        document.createElement("h2");

    const countryParagraph =
        document.createElement("p");

    const typeParagraph =
        document.createElement("p");

    const descriptionParagraph =
        document.createElement("p");

    const weatherParagraph =
        document.createElement("p");


    destinationHeading.textContent =
        chosenDestination.name;

    countryParagraph.textContent =
        chosenDestination.country;

    typeParagraph.textContent =
        "Type: " + chosenDestination.type;

    descriptionParagraph.textContent =
        chosenDestination.description;

    weatherParagraph.textContent =
        "Loading weather...";


    tripResult.appendChild(destinationHeading);

    tripResult.appendChild(countryParagraph);

    tripResult.appendChild(typeParagraph);

    tripResult.appendChild(descriptionParagraph);

    tripResult.appendChild(weatherParagraph);


    tripResult.classList.add("resultCard");


    fetchWeather(
        chosenDestination,
        weatherParagraph
    );

});


function fetchWeather(destination, weatherParagraph) {

    const cityName =
        destination.name + ", " + destination.country;

    const geocodeUrl =
        "https://geocoding-api.open-meteo.com/v1/search" +
        "?name=" + encodeURIComponent(cityName) +
        "&count=1&language=en&format=json";


    fetch(geocodeUrl)

        .then(function(response) {

            if (!response.ok) {
                throw new Error("Could not retrieve location.");
            }

            return response.json();

        })

        .then(function(locationData) {

            if (
                !locationData.results ||
                locationData.results.length === 0
            ) {
                throw new Error("Location was not found.");
            }

            const location =
                locationData.results[0];

            const latitude =
                location.latitude;

            const longitude =
                location.longitude;


            const weatherUrl =
                "https://api.open-meteo.com/v1/forecast" +
                "?latitude=" + latitude +
                "&longitude=" + longitude +
                "&current=temperature_2m" +
                "&temperature_unit=fahrenheit";


            return fetch(weatherUrl);

        })

        .then(function(response) {

            if (!response.ok) {
                throw new Error("Could not retrieve weather.");
            }

            return response.json();

        })

        .then(function(weatherData) {

            const temperature =
                weatherData.current.temperature_2m;

            weatherParagraph.textContent =
                "Current Temperature: " +
                temperature +
                "°F";

        })

        .catch(function(error) {

            console.log(error);

            weatherParagraph.textContent =
                "Weather information is unavailable.";

        });

}