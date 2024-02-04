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
            card.addEventListener("click", () => openModal(record));
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
        const images = ["images/backgrounds/bg01.jpg", "images/backgrounds/bg02.jpg", "images/backgrounds/bg03.jpg", "images/backgrounds/bg04.jpg", "images/backgrounds/bg05.jpg", "images/backgrounds/bg06.jpg", "images/backgrounds/bg07.jpg"];
        const randomIndex = Math.floor(Math.random() * images.length);
        const randomImage = images[randomIndex];
        const imagePath = randomImage;
        backgroundImageContainer.style.backgroundImage = `url('${imagePath}')`;
    }

    // Function to open modal with record details
    function openModal(record) {
        modal.style.display = "block";
        modalDetails.innerHTML = `
            <h2>${record.Title}</h2>
            <p><strong>${record.Artist}</strong></p>
            <br>
            <p><strong>Rating:</strong> ${record.Rating || "N/A"}</p>
            <p><strong>Released:</strong> ${record.Released}</p>
            <p class="collection-folder"><strong>Collection Folder:</strong> ${record.CollectionFolder}</p>
        `;
    }

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

            // Generate cards from the fetched JSON data
            generateCards(jsonData);

            // Add event listener for the "keyup" event on the search input
            searchInput.addEventListener("keyup", function () {
                // Get the user's input from the search input field
                const userInput = searchInput.value.toLowerCase();

                // Clear the card container
                cardContainer.innerHTML = "";

                // Filter and display cards based on user input
                jsonData.forEach((record, index) => {
                    const card = document.createElement("div");
                    card.classList.add("card");
                    const cardTitle = record.Title.toLowerCase();
                    const cardArtist = record.Artist.toLowerCase();
                    if (cardTitle.includes(userInput) || cardArtist.includes(userInput)) {
                        card.innerHTML = `
                            <div class="record-number">${index + 1}</div>
                            <div class="text-container">
                                <h3>${record.Title}</h3>
                                <p>${record.Artist}</p>
                            </div>
                            <p class="collection-folder">${record.CollectionFolder}</p>
                        `;
                        card.addEventListener("click", () => openModal(record));
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
