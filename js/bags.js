let productsData = {};
let allProducts = [];
let currentProductData = null;
let quantity = 1;
let selectedSize = null;

/* ================= LOAD FROM DB ================= */
document.addEventListener("DOMContentLoaded", () => {
  fetch("./api/bags.php")
    .then((res) => res.json())
    .then((data) => {
      console.log("Bags data:", data);

      allProducts = data;
      data.forEach((p) => (productsData[p.id] = p));

      buildProductsHTML(data);
      attachProductListeners();
      initFilters();
      updateColorCounts(data);
    })
    .catch((err) => console.error("DB ERROR:", err));
});

/* ================= BUILD PRODUCTS ================= */
function buildProductsHTML(products) {
  const container = document.querySelector(".products");
  if (!container) return;

  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = "<p>No products found</p>";
    return;
  }

  products.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product";
    div.dataset.id = p.id;

    const image = p.images?.[0] || "bags/placeholder.png";

    div.innerHTML = `
      <i class="fa-solid fa-heart wishlist"></i>
      <img src="${image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="price">NIS ${p.price}</div>
      <div class="rating">★★★★★</div>
      <div class="actions">
        <button class="add-cart-btn">Add to Cart</button>
        <button class="quick-view-btn" data-id="${p.id}">Quick View</button>
      </div>
    `;

    container.appendChild(div);
  });
}

/* ================= FILTER INIT ================= */
function initFilters() {
  // Search inputs
  document
    .getElementById("search-input")
    ?.addEventListener("input", applyFilters);
  document.getElementById("sidebar-search")?.addEventListener("input", (e) => {
    document.getElementById("search-input").value = e.target.value;
    applyFilters();
  });

  // Price filters
  const priceRange = document.getElementById("price-range");
  const priceBox = document.getElementById("price-box");

  priceRange?.addEventListener("input", (e) => {
    priceBox.value = e.target.value;
    applyFilters();
  });

  priceBox?.addEventListener("input", (e) => {
    const val = Math.min(Math.max(0, e.target.value), 500);
    priceBox.value = val;
    priceRange.value = val;
    applyFilters();
  });

  // Color and Size filters
  document.querySelectorAll(".color-filter, .size-filter").forEach((el) => {
    el.addEventListener("change", applyFilters);
  });

  // Sort
  document.getElementById("sort-by")?.addEventListener("change", applyFilters);

  // Reset button
  document.getElementById("reset-btn").onclick = resetFilters;
}

/* ================= APPLY FILTERS ================= */
function applyFilters() {
  const search = document
    .getElementById("search-input")
    .value.toLowerCase()
    .trim();
  const maxPrice = Number(document.getElementById("price-range").value);

  // Get selected colors
  const selectedColors = [
    ...document.querySelectorAll(".color-filter:checked"),
  ].map((c) => c.value.toLowerCase());

  // Get selected sizes (categories for bags)
  const selectedSizes = [
    ...document.querySelectorAll(".size-filter:checked"),
  ].map((s) => s.value);

  console.log("Filters:", { search, maxPrice, selectedColors, selectedSizes });

  // Filter products
  let filtered = allProducts.filter((p) => {
    // 🔍 Search filter
    const searchOk =
      !search ||
      p.name.toLowerCase().includes(search) ||
      (p.description || "").toLowerCase().includes(search);

    // 💰 Price filter
    const priceOk = Number(p.price) <= maxPrice;

    // 🎨 Color filter
    let colorOk = true;
    if (selectedColors.length > 0) {
      const productColors = (p.colors || []).map((c) => c.toLowerCase());

      // Check if ANY selected color matches ANY product color (partial match)
      colorOk = selectedColors.some((selectedColor) =>
        productColors.some(
          (productColor) =>
            productColor.includes(selectedColor) ||
            selectedColor.includes(productColor)
        )
      );
    }

    // 👜 Size/Category filter for bags
    let sizeOk = true;
    if (selectedSizes.length > 0) {
      const productSizes = (p.sizes || []).map((s) => String(s));

      // Check if ANY selected size exists in product sizes
      sizeOk = selectedSizes.some((selectedSize) =>
        productSizes.includes(selectedSize)
      );
    }

    const passes = searchOk && priceOk && colorOk && sizeOk;

    if (!passes) {
      console.log(`Product ${p.name} filtered out:`, {
        searchOk,
        priceOk,
        colorOk,
        sizeOk,
        productColors: p.colors,
        productSizes: p.sizes,
      });
    }

    return passes;
  });

  // Sort
  const sortBy = document.getElementById("sort-by")?.value;
  if (sortBy === "Price: Low to High") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy === "Price: High to Low") {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  }

  console.log(`Filtered: ${filtered.length} of ${allProducts.length} products`);

  buildProductsHTML(filtered);
  attachProductListeners();
  updateColorCounts(filtered);
}

/* ================= RESET ================= */
function resetFilters() {
  // Uncheck all filters
  document
    .querySelectorAll(".color-filter, .size-filter")
    .forEach((c) => (c.checked = false));

  // Reset search
  document.getElementById("search-input").value = "";
  document.getElementById("sidebar-search").value = "";

  // Reset price
  document.getElementById("price-range").value = 500;
  document.getElementById("price-box").value = 500;

  // Reset sort
  document.getElementById("sort-by").value = "Default";

  buildProductsHTML(allProducts);
  attachProductListeners();
  updateColorCounts(allProducts);
}

/* ================= COLOR COUNTS ================= */
function updateColorCounts(products) {
  const baseColors = [
    "black",
    "white",
    "red",
    "green",
    "pink",
    "purple",
    "blue",
    "yellow",
    "orange",
    "brown",
    "burgundy",
  ];

  const counts = {};

  products.forEach((p) => {
    const found = new Set();
    (p.colors || []).forEach((c) => {
      const color = c.toLowerCase();
      baseColors.forEach((base) => {
        if (color.includes(base)) found.add(base);
      });
    });
    found.forEach((c) => (counts[c] = (counts[c] || 0) + 1));
  });

  document.querySelectorAll(".color-filter").forEach((cb) => {
    const base = cb.value.toLowerCase();
    const label = cb.parentElement;
    const currentText = label.textContent;
    const colorName = currentText.split("(")[0].trim();
    label.innerHTML = `<input type="checkbox" class="color-filter" value="${base}"> ${colorName} (${
      counts[base] || 0
    })`;
    // Re-attach the checkbox reference
    label.querySelector("input").checked = cb.checked;
  });
}

/* ================= LISTENERS ================= */
function attachProductListeners() {
  document.querySelectorAll(".wishlist").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      btn.classList.toggle("active");
    };
  });

  document.querySelectorAll(".quick-view-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const p = productsData[btn.dataset.id];
      if (!p) return;

      document.getElementById("modalImage").src = p.images?.[0] || "";
      document.getElementById("modalTitle").textContent = p.name;
      document.getElementById("modalDescription").textContent =
        p.description || "";
      document.getElementById("modalSizes").textContent = (p.sizes || []).join(
        ", "
      );
      document.getElementById("modalStatus").textContent = "In Stock";
      document.getElementById("modalFeatures").textContent =
        "Premium Leather, Free Shipping";
      document.getElementById("quickViewModal").style.display = "flex";
    };
  });

  // 👇 عند الضغط على المنتج، انتقل لصفحة product.php
  document.querySelectorAll(".product").forEach((prod) => {
    prod.onclick = (e) => {
      // تجاهل الضغط إذا كان على الأزرار أو القلب
      if (!e.target.closest(".actions") && !e.target.closest(".wishlist")) {
        const productId = prod.dataset.id;
        // الانتقال لصفحة المنتج
        window.location.href = `api/product.php?id=${productId}`;
      }
    };
  });

  // Add to cart buttons
  document.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const prod = e.target.closest(".product");
      const productId = prod.dataset.id;
      const product = productsData[productId];

      if (product) {
        addToCart(e, product);
      }
    };
  });
}

/* ================= MODAL CLOSE ================= */
document.querySelector(".close")?.addEventListener("click", () => {
  document.getElementById("quickViewModal").style.display = "none";
});

window.onclick = (e) => {
  const modal = document.getElementById("quickViewModal");
  if (e.target === modal) modal.style.display = "none";
};
