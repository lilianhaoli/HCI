(() => {
  // Sample data for demo — in a real project this comes from the scraper / API
  // Use local images from ./img/ and coords (lat, lng) centered around Williamsburg, VA (37.2707, -76.7075)
  const listings = [
    {
      id: "l1",
      title: "Fully Furnished Smart Studio Apartment",
      desc: "2 guests | 1 bedroom | 2 bathroom",
      host: "Mercedes Vito",
      rating: 4.8,
      img: "img/fully_furnished.png",
      pinImg: "img/1360_blip.png",
      price: "$1360 / Month",
      bedBath: "1 Bed | 1 Bath",
      coords: [37.2921, -76.7078],
    },
    {
      id: "l2",
      title: "Furnished Apartment",
      desc: "4 guests | 3 bedroom | 2 bathroom",
      host: "Mercedes Vito",
      rating: 3.8,
      img: "img/furnished.png",
      pinImg: "img/1450_blip.png",
      price: "$1450 / Month",
      bedBath: "1 Bed | 1 Bath",
      coords: [37.2698, -76.7429],
    },
    {
      id: "l3",
      title: "Classic Studio Apartment",
      desc: "2 guests | 2 bedroom | 2 bathroom",
      host: "Mercedes Vito",
      rating: 4.0,
      img: "img/classic_studio.png",
      pinImg: "img/1383_blip.png",
      price: "$1383 / Month",
      bedBath: "1 Bed | 1 Bath",
      coords: [37.2716, -76.6838],
    },
  ];

  const results = document.getElementById("results");
  const cardTemplate = document.getElementById("card-template");
  const pinTemplate = document.getElementById("pin-template");
  const mapCanvas = document.querySelector(".map-canvas");

  // Initialize Leaflet map centered on Williamsburg, VA
  const MAP_CENTER = [37.2707, -76.7075];
  const MAP_ZOOM = 13;
  let map;
  let markerLayer;
  const markers = {}; // id -> marker
  if (window.L) {
    // move zoom controls to bottomright to match screenshot
    map = L.map("leaflet-map", { zoomControl: false }).setView(
      MAP_CENTER,
      MAP_ZOOM
    );
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);

    // (removed decorative dashed circle)
  } else {
    console.warn("Leaflet not available - map will not render");
  }

  // When the window resizes, ensure the map redraws and fits bounds again
  window.addEventListener("resize", () => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
        try {
          const b = markerLayer && markerLayer.getBounds();
          if (b && b.isValid())
            map.fitBounds(b, { padding: [60, 60], maxZoom: 13 });
        } catch (e) {}
      }, 120);
    }
  });

  function renderListings(items) {
    results.innerHTML = "";
    items.forEach((item) => {
      const tpl = cardTemplate.content.cloneNode(true);
      const article = tpl.querySelector(".card");
      const imgEl = tpl.querySelector(".card-img");
      imgEl.src = item.img;
      // lazy-load images to improve initial render performance
      try {
        imgEl.loading = "lazy";
      } catch (e) {}
      imgEl.alt = item.title;
      // fallback if remote image fails
      imgEl.onerror = () => {
        imgEl.src = "https://picsum.photos/800/600?random=7";
      };

      tpl.querySelector(".card-title").textContent = item.title;
      tpl.querySelector(".meta .rating").textContent = `⭐ ${item.rating}`;
      tpl.querySelector(".meta .host").textContent = item.host;
      tpl.querySelector(".card-desc").textContent = item.desc;
      tpl.querySelector(".price-badge").textContent = item.price;
      // expose a numeric price on the card for easy DOM sorting/filtering
      article.dataset.price = parsePrice(item.price);
      article.dataset.id = item.id;

      article.addEventListener("mouseenter", () => highlight(item.id));
      article.addEventListener("mouseleave", () => unhighlight(item.id));
      article.addEventListener("click", () => {
        // focus corresponding marker on map
        if (markers[item.id] && map) {
          const m = markers[item.id];
          map.setView(m.getLatLng(), Math.max(map.getZoom(), 14), {
            animate: true,
          });
          m.openPopup();
          // temporary highlight the marker element
          const el = m.getElement();
          if (el) {
            el.classList.add("highlight");
            setTimeout(() => el.classList.remove("highlight"), 1400);
          }
        }
      });

      article.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") article.click();
      });

      results.appendChild(tpl);
    });
  }
  function renderPins(items) {
    if (!map || !markerLayer) return;
    // clear existing markers
    markerLayer.clearLayers();
    Object.keys(markers).forEach((k) => delete markers[k]);
    // Spread markers that are close together to avoid overlap (default gentle repulsion)
    const spaced = spreadMarkersForce(items, 0.0012, 200); // min distance in degrees, iterations

    spaced.forEach((item) => {
      const imgSrc = item.pinImg || item.img;
      const html = `
        <div class="listing-pin" data-id="${item.id}">
          <img src="${imgSrc}" alt="${item.title}" onerror="this.src='img/1360_blip.png'" />
          <div class="pin-label"><div class="price">${item.price}</div><div class="small">${item.bedBath}</div></div>
        </div>`;

      const icon = L.divIcon({
        html,
        className: "",
        iconSize: [140, 56],
        popupAnchor: [0, -6],
      });
      const marker = L.marker(item._coordsSpread || item.coords, {
        icon,
      }).addTo(markerLayer);
      marker.bindPopup(`<strong>${item.title}</strong><br>${item.price}`);
      markers[item.id] = marker;

      // wire interactions
      marker.on("mouseover", () => highlight(item.id));
      marker.on("mouseout", () => unhighlight(item.id));
      marker.on("click", () => {
        const card = document.querySelector(`.card[data-id="${item.id}"]`);
        if (card) {
          card.classList.add("highlight");
          setTimeout(() => card.classList.remove("highlight"), 1400);
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });

    // (removed decorative polyline between markers)

    // Fit bounds so all (possibly spread) markers are visible when window is resized or map is small
    try {
      const group = markerLayer.getBounds();
      if (group.isValid()) {
        map.fitBounds(group, { padding: [80, 80], maxZoom: 13 });
      }
    } catch (e) {
      /* ignore if no bounds */
    }
  }

  // Force-based spreading to separate markers more robustly
  function spreadMarkersForce(items, minDistDeg = 0.0012, maxIter = 200) {
    // copy items and create mutable coordinates
    const pts = items.map((i) => ({
      ...i,
      _coords: [i.coords[0], i.coords[1]],
    }));
    for (let iter = 0; iter < maxIter; iter++) {
      let moved = false;
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          const pa = pts[a]._coords;
          const pb = pts[b]._coords;
          let dx = pb[0] - pa[0];
          let dy = pb[1] - pa[1];
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) {
            // jitter if exactly overlapping
            dx = (Math.random() - 0.5) * minDistDeg;
            dy = (Math.random() - 0.5) * minDistDeg;
            dist = Math.sqrt(dx * dx + dy * dy) || minDistDeg;
          }
          if (dist < minDistDeg) {
            moved = true;
            const overlap = (minDistDeg - dist) / 2;
            const ux = dx / dist;
            const uy = dy / dist;
            const factor = 1.0;
            // apply stronger displacement but clamp to reasonable step to avoid huge jumps
            const step = Math.min(overlap * factor, minDistDeg * 0.25);
            pts[b]._coords[0] += ux * step;
            pts[b]._coords[1] += uy * step;
            pts[a]._coords[0] -= ux * step;
            pts[a]._coords[1] -= uy * step;
          }
        }
      }
      if (!moved) break;
    }
    pts.forEach((p) => (p._coordsSpread = p._coords));
    return pts;
  }

  function highlight(id) {
    document.querySelectorAll(".card").forEach((c) => {
      c.classList.toggle("highlight", c.dataset.id === id);
    });
    // highlight leaflet marker element if present
    if (markers[id]) {
      const el = markers[id].getElement();
      if (el) el.classList.add("highlight");
    }
  }
  function unhighlight(id) {
    document
      .querySelectorAll(".card")
      .forEach((c) => c.classList.remove("highlight"));
    // remove highlight from all marker elements
    Object.keys(markers).forEach((k) => {
      const m = markers[k];
      const el = m && m.getElement();
      if (el) el.classList.remove("highlight");
    });
  }

  // wire up search and controls (demo only)
  document.getElementById("search-btn").addEventListener("click", () => {
    const q = document
      .getElementById("search-input")
      .value.trim()
      .toLowerCase();
    if (!q) {
      showItems(listings);
      return;
    }
    const filtered = listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) || l.desc.toLowerCase().includes(q)
    );
    showItems(filtered);
  });

  // allow Enter key in search input
  document.getElementById("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.getElementById("search-btn").click();
    }
  });

  document.getElementById("advanced-btn").addEventListener("click", () => {
    alert("Advanced search panel (demo)");
  });

  // --- Phase A helpers: sorting, toggles, result count ---
  let currentSort = "recommended";
  let currentItems = listings.slice();

  function parsePrice(priceStr) {
    if (!priceStr) return Infinity;
    const m = priceStr.match(/[\d,]+/);
    if (!m) return Infinity;
    return parseInt(m[0].replace(/,/g, ""), 10);
  }

  function applySort(items, mode) {
    if (!items || !items.slice) return items;
    const copy = items.slice();
    if (mode === "price-asc") {
      copy.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (mode === "price-desc") {
      copy.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (mode === "rating") {
      copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    // 'recommended' keeps original order
    return copy;
  }

  function updateResultCount(items) {
    const el = document.getElementById("results-count");
    if (el)
      el.textContent = `${items.length} result${items.length !== 1 ? "s" : ""}`;
  }

  function showItems(items) {
    currentItems = items.slice ? items.slice() : [];
    const sorted = applySort(currentItems, currentSort);
    renderListings(sorted);
    renderPins(sorted);
    updateResultCount(sorted);
  }

  // wire sort control
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value || "recommended";
      showItems(currentItems);
    });
  }

  // map / list toggle
  const pageEl = document.querySelector(".page");
  const showMapBtn = document.getElementById("show-map");
  const showListBtn = document.getElementById("show-list");
  if (showMapBtn && showListBtn && pageEl) {
    showMapBtn.addEventListener("click", () => {
      pageEl.classList.remove("list-only");
      pageEl.classList.add("map-only");
      showMapBtn.classList.add("active");
      showMapBtn.setAttribute("aria-pressed", "true");
      showListBtn.classList.remove("active");
      showListBtn.setAttribute("aria-pressed", "false");
      // ensure map refresh
      if (map) setTimeout(() => map.invalidateSize(), 180);
    });
    showListBtn.addEventListener("click", () => {
      pageEl.classList.remove("map-only");
      pageEl.classList.add("list-only");
      showListBtn.classList.add("active");
      showListBtn.setAttribute("aria-pressed", "true");
      showMapBtn.classList.remove("active");
      showMapBtn.setAttribute("aria-pressed", "false");
    });
  }

  // initial render (use showItems which also updates the count)
  showItems(listings);
})();
