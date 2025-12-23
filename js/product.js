/* =========================================================
   PRODUCT PAGE FUNCTIONALITY (DETAIL PAGE)
   - Gallery (thumbnails)
   - Size / Color / Quantity
   - Add to cart (localStorage as your current cart.js logic)
   - Wishlist (DATABASE) + Wishlist Sidebar same style as Cart
========================================================= */

/* =========================
   IMAGE GALLERY
========================= */
function changeImage(thumbnail) {
  const mainImage = document.getElementById("mainImage");
  if (!mainImage) return;

  mainImage.src = thumbnail.src;

  document
    .querySelectorAll(".thumbnail")
    .forEach((t) => t.classList.remove("active"));
  thumbnail.classList.add("active");
}

/* =========================
   SIZE
========================= */
function selectSize(element) {
  document.querySelectorAll(".size-option").forEach((opt) => {
    opt.classList.remove("active");
  });
  element.classList.add("active");
  selectedSize = element.textContent.trim();
}

/* =========================
   COLOR
========================= */
function selectColor(element) {
  document.querySelectorAll(".color-option").forEach((opt) => {
    opt.classList.remove("active");
  });
  element.classList.add("active");

  selectedColor = element.dataset.color;

  const colorName = element.getAttribute("title") || selectedColor;
  const nameEl = document.getElementById("selectedColorName");
  if (nameEl) nameEl.textContent = colorName;
}

/* =========================
   QUANTITY
========================= */
function decreaseQuantity() {
  if (typeof quantity === "undefined") quantity = 1;

  if (quantity > 1) {
    quantity--;
    const q = document.getElementById("quantity");
    if (q) q.textContent = quantity;
  }
}

function increaseQuantity() {
  if (typeof quantity === "undefined") quantity = 1;

  quantity++;
  const q = document.getElementById("quantity");
  if (q) q.textContent = quantity;
}

/* =========================
   ADD TO CART (LOCALSTORAGE)
   (Keeping your existing approach)
========================= */
function addToCartFromDetail() {
  if (!window.currentProductData) {
    alert("Product data not available");
    return;
  }

  // size required?
  if (
    currentProductData.sizes &&
    currentProductData.sizes.length > 0 &&
    !window.selectedSize
  ) {
    alert("Please select a size");
    return;
  }

  // color required?
  if (
    currentProductData.colors &&
    currentProductData.colors.length > 0 &&
    !window.selectedColor
  ) {
    alert("Please select a color");
    return;
  }

  if (typeof window.quantity === "undefined") window.quantity = 1;

  const item = {
    id: currentProductData.id,
    title: currentProductData.name,
    price: "NIS " + parseFloat(currentProductData.price).toFixed(2),
    image:
      currentProductData.images && currentProductData.images[0]
        ? currentProductData.images[0]
        : "",
    size: window.selectedSize || null,
    color: window.selectedColor || null,
    quantity: window.quantity || 1,
  };

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const existingIndex = cart.findIndex(
    (c) => c.id === item.id && c.size === item.size && c.color === item.color
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();

  showNotification("Product added to cart!");

  // Animate cart icon (optional)
  const cartIcon = document.querySelector(".icon-badge .fa-bag-shopping");
  if (cartIcon) {
    cartIcon.classList.add("animate");
    setTimeout(() => cartIcon.classList.remove("animate"), 300);
  }

  // Reset quantity
  window.quantity = 1;
  const q = document.getElementById("quantity");
  if (q) q.textContent = "1";
}

/* =========================
   CART BADGES UI
========================= */
function updateCartUI() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const cartCountEls = document.querySelectorAll(
    "#cart-count, #cart-items-count"
  );
  cartCountEls.forEach((el) => {
    if (el) el.textContent = count;
  });
}

/* =========================
   NOTIFICATION
========================= */
function showNotification(message) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #8C28B6 0%, #c0392b 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 9999;
    animation: slideIn 0.3s ease;
    font-weight: 600;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

/* =========================
   WISHLIST (DATABASE)
   API:
     GET  /heels/api/wishlist.php          -> returns wishlist items
     POST /heels/api/wishlist.php?action=toggle (product_id=ID) -> add/remove
========================= */

function fetchWishlistItems() {
  return fetch("/heels/api/wishlist.php", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then((res) => res.json())
    .catch(() => []);
}

function updateWishlistCount() {
  return fetchWishlistItems().then((items) => {
    const badge = document.getElementById("wishlist-count");
    if (badge) badge.textContent = items && items.length ? items.length : 0;

    const countEl = document.getElementById("wishlist-items-count");
    if (countEl) countEl.textContent = items && items.length ? items.length : 0;

    return items;
  });
}

function wishlistToggle(productId) {
  return fetch("/heels/api/wishlist.php?action=toggle", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "product_id=" + encodeURIComponent(productId),
  }).then((res) => res.json());
}

/* =========================
   WISHLIST SIDEBAR OPEN/CLOSE
   (same style as cart: .active)
========================= */
window.viewWishlist = function () {
  renderWishlistSidebar();
  const sidebar = document.getElementById("wishlistSidebar");
  const overlay = document.getElementById("wishlistOverlay");
  if (sidebar) sidebar.classList.add("active");
  if (overlay) overlay.classList.add("active");
};

window.closeWishlist = function () {
  const sidebar = document.getElementById("wishlistSidebar");
  const overlay = document.getElementById("wishlistOverlay");
  if (sidebar) sidebar.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
};

/* =========================
   WISHLIST SIDEBAR RENDER
   - cards clickable -> opens product page
   - remove button (×) toggles remove
========================= */
function renderWishlistSidebar() {
  const box = document.getElementById("wishlistItemsContainer");
  if (!box) return;

  fetchWishlistItems().then((items) => {
    box.innerHTML = "";

    const countEl = document.getElementById("wishlist-items-count");
    if (countEl) countEl.textContent = items && items.length ? items.length : 0;

    if (!items || items.length === 0) {
      box.innerHTML = `
        <div style="padding:40px;text-align:center;color:#777;">
          <i class="fa-solid fa-heart" style="font-size:40px;margin-bottom:10px;"></i>
          <p>Your wishlist is empty</p>
        </div>
      `;
      return;
    }

    items.forEach((p) => {
      const imgSrc = p.image || "/heels/heels/logo1.png";
      const price = parseFloat(p.base_price || 0).toFixed(2);

      box.insertAdjacentHTML(
        "beforeend",
        `
    <div class="cart-item" style="cursor:pointer;"
         onclick="openWishlistProduct(${p.id})">

      <img src="${imgSrc}"
           alt="${escapeHtml(p.name)}"
           class="cart-item-image"
           style="width:120px;height:140px;object-fit:cover;border-radius:8px;">

      <div class="cart-item-details">
        <h4 class="cart-item-title">${escapeHtml(p.name)}</h4>
        <div class="cart-item-price">NIS ${price}</div>
        <div class="cart-item-info">
          <strong>Category:</strong> ${escapeHtml(p.category || "")}
        </div>
      </div>

      <button class="cart-item-remove"
        style="text-decoration:none;font-size:22px;line-height:1;align-self:flex-start;"
        onclick="event.stopPropagation(); removeWishlistItem(${p.id});"
        title="Remove">
        &times;
      </button>
    </div>
    `
      );
    });
  });
}

window.openWishlistProduct = function (productId) {
  window.location.href = "/heels/api/product.php?id=" + productId;
};

window.removeWishlistItem = function (productId) {
  wishlistToggle(productId).then(() => {
    updateWishlistCount();
    renderWishlistSidebar();
  });
};

/* =========================
   WISHLIST ICON (DETAIL PAGE HEART)
   - toggles current product in DB
========================= */
window.toggleWishlistDetail = function () {
  if (!window.currentProductData) return;

  wishlistToggle(currentProductData.id).then(() => {
    updateWishlistCount();
    renderWishlistSidebar();
  });
};

/* =========================
   COLOR STYLE INIT
   (optional - you already have CSS mapping by data-color,
    but this keeps it safe if some colors not listed)
========================= */
function initializeColorSelectors() {
  const colorOptions = document.querySelectorAll(".color-option");

  colorOptions.forEach((option) => {
    const color = (option.dataset.color || "").toLowerCase();

    const colorMap = {
      "dark red suede": "#8B0000",
      burgundy: "#800020",
      orange: "#e67e22",
      yellow: "#f39c12",
      "dark green suede": "#06470C",
      blue: "#A6C8D4",
      "dark purple suede": "#7851A9",
      "dark pink suede": "#C71585",
      "black suede": "#111111",
      "white leather": "#FFFFF0",
      gray: "#95a5a6",
      brown: "#8B4513",
      gold: "#FFD700",
      silver: "#C0C0C0",
      "mirror green": "#046307",
      green: "#06470C",
      black: "#111111",
      pink: "#FFB6C1",
      "black leather": "#111111",
      white: "#FFFFF0",
      red: "#c41e3a",
      navy: "#000080",
      purple: "#1F0033",
      fuchsia: "#FF1493",
      champagne: "#f7e7ce",
      "royal blue": "#4169E1",
      camel: "#C2B280",
      blush: "#FFDAB9",
      aqua: "#00FFFF",
      "candy pink": "#FF69B4",
      velvet: "#4B1C2D",
    };

    const bgColor = colorMap[color] || color;
    if (bgColor) option.style.backgroundColor = bgColor;

    if (["white", "white leather", "champagne", "blush"].includes(color)) {
      option.style.border = "2px solid #e8ecef";
    }
  });
}

/* =========================
   HELPERS
========================= */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   CSS ANIMATIONS (needed for notification)
========================= */
(function injectAnimations() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to   { transform: translateX(100%); opacity: 0; }
    }
    @keyframes pop {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    .animate { animation: pop 0.3s ease; }
  `;
  document.head.appendChild(style);
})();

/* =========================
   PAGE LOAD INIT
========================= */
