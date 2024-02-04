document.addEventListener("DOMContentLoaded", function () {
    const cardContainer = document.getElementById("card-container");
    const modal = document.getElementById("modal");
    const modalContent = document.querySelector(".modal-content");
    const closeBtn = document.querySelector(".close");
    const modalDetails = document.getElementById("modal-details");
    const backgroundImageContainer = document.getElementById("background-image-container");

    modal.style.display = "none";

    // Array of image file names in your images directory
    const images = ["images/backgrounds/bg01.jpg", "images/backgrounds/bg02.jpg", "images/backgrounds/bg03.jpg", "images/backgrounds/bg04.jpg", "images/backgrounds/bg05.jpg", "images/backgrounds/bg06.jpg", "images/backgrounds/bg07.jpg"];

    // Counter variable to keep track of the card index
    let cardCounter = 0;

    // Function to generate cards from JSON data
    function generateCards(data) {
        data.forEach((record, index) => {
            const card = document.createElement("div");
            card.classList.add("card");
            card.innerHTML = `
                <div class="record-number">${index + 1}</div>
                <div class="text-container">
                    <h3>${record.Title}</h3>
                    <p>${record.Artist}</p>
                </div>
            `;
            card.addEventListener("click", () => openModal(record));
            cardContainer.appendChild(card);

            // Log the card counter to the console
            //console.log("Card Counter:", cardCounter);

            // Increment the card counter
            cardCounter++;

            // Create and add the counter number to the lower right circle
            const recordNumber = document.createElement("div");
            recordNumber.classList.add("record-number-circle");
            recordNumber.innerText = cardCounter;
            card.appendChild(recordNumber);
        });
    }

    // Function to set a random background image
    function setRandomBackgroundImage() {
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
            <p><strong> ${record.Artist}</strong></p>
            <br>
            <p><strong>Rating:</strong> ${record.Rating || "N/A"}</p>
            <p><strong>Released:</strong> ${record.Released}</p>
            <p><strong>Collection Folder:</strong> ${record.CollectionFolder}</p>
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

    // Set a random background image on page load
    setRandomBackgroundImage();

    // Fetch JSON data from the data directory
    fetch("data/output.json") // Adjust the path as needed
        .then((response) => response.json())
        .then((jsonData) => {
            // Generate cards from the fetched JSON data
            generateCards(jsonData);
        })
        .catch((error) => {
            console.error("Error fetching JSON data:", error);
        });
});
