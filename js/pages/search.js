// FULL UPDATED search.js (placed in js/pages/search.js)

const searchInput = document.getElementById("searchInput");
const dropdown = document.getElementById("searchDropdown");
const searchContainer = document.querySelector(".search-container");

// ---- Listing Data with Dummy Information ----
const listingsData = [
  {
    address: "101 Richmond Rd, Williamsburg, VA",
    price: "$1,950 / month",
    beds: 3,
    baths: 2,
    lat: 37.2701,
    lng: -76.7075,
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
    ],
    amenities: ["Washer & Dryer", "Free Parking", "Near Campus", "Pet Friendly"]
  },
  {
    address: "250 Jamestown Ave, Williamsburg, VA",
    price: "$2,200 / month",
    beds: 4,
    baths: 3,
    lat: 37.2561,
    lng: -76.7188,
    images: [
      "https://images.unsplash.com/photo-1599423300746-b62533397364",
      "https://images.unsplash.com/photo-1588414731048-895f9f2767d7"
    ],
    amenities: ["New Appliances", "Backyard", "Quiet Area", "Dishwasher"]
  },
  {
    address: "400 Campus Circle, Williamsburg, VA",
    price: "$1,750 / month",
    beds: 2,
    baths: 1,
    lat: 37.2725,
    lng: -76.7133,
    images: [
      "https://images.unsplash.com/photo-1599423300746-b62533397364",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
    ],
    amenities: ["Close to Campus", "Fully Furnished", "Heating Included"]
  }
];

// ---- Show dropdown on input focus ----
searchInput.addEventListener("focus", () => {
  searchContainer.classList.add("active");
  renderDropdown(listingsData);
  dropdown.style.display = "block";
});

// ---- Close dropdown when clicking outside ----
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    searchContainer.classList.remove("active");
    dropdown.style.display = "none";
  }
});

// ---- Filter addresses as user types ----
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase().trim();

  if (query === "") {
    renderDropdown(listingsData);
    return;
  }

  const filtered = listingsData.filter(listing =>
    listing.address.toLowerCase().includes(query)
  );

  renderDropdown(filtered);
});

// ---- Render dropdown items ----
function renderDropdown(listings) {
  dropdown.innerHTML = "";

  if (!listings || listings.length === 0) {
    dropdown.innerHTML = `<div class="dropdown-item no-result">No results found</div>`;
    dropdown.style.display = "block";
    return;
  }

  listings.forEach(listing => {
    const item = document.createElement("div");
    item.classList.add("dropdown-item");
    item.textContent = listing.address;

    // ---- Redirect when clicked ----
    item.addEventListener("click", () => {
      const encoded = encodeURIComponent(JSON.stringify(listing));
      window.location.href = `/pages/listing.html?data=${encoded}`;
    });

    dropdown.appendChild(item);
  });

  dropdown.style.display = "block";
}
