const searchInput = document.getElementById("searchInput");
const dropdown = document.getElementById("searchDropdown");
const searchContainer = document.querySelector(".search-container");

let listingsData = [];
let dataLoaded = false;

// Load listings.json on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/data/listings.json");
    if (!res.ok) throw new Error("Failed to load listings.json");
    const json = await res.json();
    listingsData = Array.isArray(json) ? json : json.listings || [];
    dataLoaded = true;
  } catch (err) {
    console.error("Error loading listings.json:", err);
    listingsData = [];
  }
});

// Show dropdown on input focus
searchInput.addEventListener("focus", () => {
  searchContainer.classList.add("active");
  if (!dataLoaded) {
    dropdown.innerHTML = `<div class="dropdown-item no-result">Loading listings...</div>`;
    dropdown.style.display = "block";
    return;
  }
  renderDropdown(listingsData);
  dropdown.style.display = "block";
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    searchContainer.classList.remove("active");
    dropdown.style.display = "none";
  }
});

// Filter dropdown items as user types
searchInput.addEventListener("input", () => {
  if (!dataLoaded) return;
  const query = searchInput.value.toLowerCase().trim();
  if (query === "") {
    renderDropdown(listingsData);
    return;
  }
  const filtered = listingsData.filter((listing) =>
    (listing.address || "").toLowerCase().includes(query)
  );
  renderDropdown(filtered);
});

// Render dropdown items limiting to max 5
function renderDropdown(listings) {
  dropdown.innerHTML = "";
  if (!listings || listings.length === 0) {
    dropdown.innerHTML = `<div class="dropdown-item no-result">No results found</div>`;
    dropdown.style.display = "block";
    return;
  }
  const maxResults = 5;
  const limitedListings = listings.slice(0, maxResults);
  limitedListings.forEach((listing) => {
    const item = document.createElement("div");
    item.classList.add("dropdown-item");
    item.textContent = listing.address || "Unnamed listing";
    item.addEventListener("click", () => {
      // Use listing ID in query for listing.html page
      window.location.href = `/pages/listing.html?id=${listing.id}`;
    });
    dropdown.appendChild(item);
  });
  dropdown.style.display = "block";
}
