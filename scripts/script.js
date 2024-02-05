document.addEventListener("DOMContentLoaded", function () {
    // DOM elements
    const cardContainer = document.getElementById("card-container");
    const modal = document.getElementById("modal");
    const closeBtn = document.querySelector(".close");
    const modalDetails = document.getElementById("modal-details");
    const backgroundImageContainer = document.getElementById("background-image-container");
    const searchInput = document.getElementById("search-input");

    // Initialize modal to be hidden
    modal.style.display = "none";

    // Store the filtered data separately
    let filteredData = [];

// Event delegation for opening the modal
cardContainer.addEventListener("click", (event) => {
    const card = event.target.closest(".card");
    if (card) {
        const index = Array.from(cardContainer.children).indexOf(card);
        //console.log("Index:", index); // Debugging line
        //console.log("jsonData at Index:", jsonData[index]); // Debugging line
        openModal(jsonData[index]);
    }
});


    // Function to generate and display randomized cards
    function generateAndDisplayRandomCards(data) {
        // Shuffle the data array randomly
        const shuffledData = shuffleArray(data);

        // Clear the card container
        cardContainer.innerHTML = "";

        // Generate and display cards based on randomized data
        generateCards(shuffledData);
    }

    // Function to shuffle an array randomly (Fisher-Yates shuffle algorithm)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Store the original card styles in an array
    const originalCardStyles = [];

    // Store the JSON data
    let jsonData = [];

    // Function to generate cards based on the data
    function generateCards(data) {
        data.forEach((record, index) => {
            const card = document.createElement("div");
            card.classList.add("card");
            card.innerHTML = `
                <div class="text-container">
                    <h3>${record.Title}</h3>
                    <p>${record.Artist}</p>
                </div>
            `;
            cardContainer.appendChild(card);

            // Increment the card counter
            const cardCounter = index + 1;

            // Create and add the counter number to the lower right circle
            const recordNumber = document.createElement("div");
            recordNumber.classList.add("record-number-circle");
            recordNumber.innerText = cardCounter;
            card.appendChild(recordNumber);

            // Store the original style of each card
            originalCardStyles.push("block");
        });
    }

    // Function to set a random background image
    function setRandomBackgroundImage() {
        const images = [
            "images/backgrounds/bg01.jpg",
            "images/backgrounds/bg02.jpg",
            "images/backgrounds/bg03.jpg",
            "images/backgrounds/bg04.jpg",
            "images/backgrounds/bg05.jpg",
            "images/backgrounds/bg06.jpg",
            "images/backgrounds/bg07.jpg",
        ];
        const randomIndex = Math.floor(Math.random() * images.length);
        const randomImage = images[randomIndex];
        const imagePath = randomImage;
        backgroundImageContainer.style.backgroundImage = `url('${imagePath}')`;
    }

    function openModal(record) {
        if (record && typeof record === "object") {
            modal.style.display = "block";
    
            // Set the album art image source
            const albumArt = document.getElementById("album-art");
            albumArt.src = record["Spotify_Album_Art_URL"] || ""; // Use the "Spotify_Album_Art_URL" from the record object
    
            // Set the modal details
            const modalTitle = document.querySelector("#modal-title");
            modalTitle.innerText = record.Title || "Title";
    
            const modalArtist = document.querySelector("#modal-artist");
            modalArtist.innerText = record.Artist || "Artist";
    
            // Set the Spotify album link
            const spotifyLink = document.querySelector("#modal-spotify-link");
            spotifyLink.href = record["Spotify_Album_URL"] || "#"; // Use the "Spotify_Album_URL" from the record object
    
            // Set the Discogs catalog link
            const discogsLink = document.querySelector("#modal-discogs-link");
            const catalogNumber = record["Catalog#"] || ""; // Use the "Catalog" from the record object
    
            // Print catalogNumber to the console
            //console.log("Catalog ID:", catalogNumber);
    
            // Set the specific collection as a variable
            const userCollection = "jasonhand24"; // Replace with your actual collection name
    
            // Create the Discogs base URL with the variable
            const discogsBaseUrl = `https://www.discogs.com/user/${userCollection}/collection`;
            const searchParam = encodeURIComponent(catalogNumber); // Encode the catalog number
            discogsLink.href = `${discogsBaseUrl}?search=${searchParam}`; // Build the complete URL
        } else {
            console.error("Record is undefined or not an object:", record);
        }
    }
    
       

    // Event delegation for opening the modal
    cardContainer.addEventListener("click", (event) => {
        const card = event.target.closest(".card");
        if (card) {
            const index = Array.from(cardContainer.children).indexOf(card);
            openModal(jsonData[index]);
        }
    });

    // Close modal when clicking the close button
    closeBtn.addEventListener("click", () => closeModal());

    // Close modal when clicking outside the modal content
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Function to close modal
    function closeModal() {
        modal.style.display = "none";
    }

// Fetch JSON data from the data directory
fetch("data/output.json") // Adjust the path as needed
    .then((response) => response.json())
    .then((jsonDataResponse) => {
        jsonData = jsonDataResponse; // Store JSON data
        //console.log("Fetched JSON Data:", jsonData); // Debugging line


            // Generate cards from the fetched JSON data
            generateCards(jsonData);

            // Add event listener for the "keyup" event on the search input
            searchInput.addEventListener("keyup", function () {
                // Get the user's input from the search input field
                const userInput = searchInput.value.toLowerCase();

                // Clear the card container
                cardContainer.innerHTML = "";

                // Filter and display cards based on user input
                filteredData = [];
                jsonData.forEach((record, index) => {
                    const card = document.createElement("div");
                    card.classList.add("card");
                    const cardTitle = record.Title.toLowerCase();
                    const cardArtist = record.Artist.toLowerCase();
                    if (cardTitle.includes(userInput) || cardArtist.includes(userInput)) {
                        card.innerHTML = `
                            <div class="text-container">
                                <h3>${record.Title}</h3>
                                <p>${record.Artist}</p>
                            </div>
                        `;
                        cardContainer.appendChild(card);

                        // Increment the card counter
                        const cardCounter = index + 1;

                        // Create and add the counter number to the lower right circle
                        const recordNumber = document.createElement("div");
                        recordNumber.classList.add("record-number-circle");
                        recordNumber.innerText = cardCounter;
                        card.appendChild(recordNumber);

                        // Store the original style of each card
                        originalCardStyles.push("block");

                        // Store the filtered data
                        filteredData.push(record);
                    }
                });
                
            });

            // Set a random background image on page load
            setRandomBackgroundImage();
        })
        .catch((error) => {
            console.error("Error fetching JSON data:", error);
        });
});
