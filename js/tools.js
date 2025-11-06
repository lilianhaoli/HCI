// tools.js
// Small helper: accordion behavior + quick search for tools page
(function () {
  function closeOtherDetails(openDetail) {
    document.querySelectorAll(".tool-details[open]").forEach(function (d) {
      if (d !== openDetail) d.removeAttribute("open");
    });
  }

  // Accordion: when a details element toggles open, close the others
  function initAccordion() {
    document.querySelectorAll(".tool-details").forEach(function (det) {
      det.addEventListener("toggle", function (e) {
        if (det.open) closeOtherDetails(det);
      });
    });
  }

  // Quick search: filter tool sections (left column) and tool items (sidebar)
  function initQuickSearch() {
    var input = document.getElementById("tools-quick-search");
    if (!input) return;
    var timeout = null;
    input.addEventListener("input", function () {
      clearTimeout(timeout);
      timeout = setTimeout(applyFilter, 180);
    });

    function applyFilter() {
      var q = input.value.trim().toLowerCase();
      var sections = document.querySelectorAll(".tool-section");
      var items = document.querySelectorAll(".tools-list .tool-item");

      // filter sidebar items
      items.forEach(function (li) {
        var text = (li.textContent || "").toLowerCase();
        li.style.display = q === "" || text.indexOf(q) !== -1 ? "" : "none";
      });

      // filter main sections
      sections.forEach(function (sec) {
        var title = (sec.querySelector("h2") || {}).textContent || "";
        var body = (sec.querySelector(".tool-body") || {}).textContent || "";
        var hay = (title + " " + body).toLowerCase();
        var match = q === "" || hay.indexOf(q) !== -1;
        sec.style.display = match ? "" : "none";
        // collapse details for hidden sections
        var det = sec.querySelector(".tool-details");
        if (det && !match) det.removeAttribute("open");
      });
    }
  }

  // Make the sidebar sticky support a11y: ensure it's not offscreen on load
  function init() {
    initAccordion();
    initQuickSearch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
