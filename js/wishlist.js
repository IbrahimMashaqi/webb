/* =========================================================
   WISHLIST SYSTEM - DATABASE VERSION (COMPLETE)
   File: /heels/js/wishlist.js
   - Single source of truth (Database)
   - No localStorage conflicts
   - Proper error handling
   - Works on all pages
========================================================= */

// ================================
// API CALLS
// ================================

function fetchWishlistItems() {
  return fetch("/heels/api/wishlist.php", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then((res) => {
      if (!res.ok) throw new Error("Network error");
      return res.json();
    })
    .then((data) => {
      // Handle error response
      if (data.error) {
        console.log("Wishlist error:", data.error);
        return [];
      }
      return data;
    })
    .catch((err) => {
      console.error("Wishlist fetch error:", err);
      return [];
    });
}

function wishlistToggle(productId) {
  return fetch("/heels/api/wishlist.php?action=toggle", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    credentials: "same-origin",
    body: "product_id=" + encodeURIComponent(productId),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Network error");
      return res.json();
    })
    .then((data) => {
      if (data.error === "NOT_LOGGED_IN") {
        window.location.href = "/heels/login.html";
        return null;
      }
      return data;
    })
    .catch((err) => {
      console.error("Wishlist toggle error:", err);
      return null;
    });
}

// ================================
// UPDATE WISHLIST COUNT (BADGE)
// ================================

function updateWishlistCount() {
  return fetchWishlistItems().then((items) => {
    const count = items ? items.length : 0;

    // Update all badge elements
    const badges = document.querySelectorAll(
      "#wishlist-count, #wishlist-items-count"
    );
    badges.forEach((badge) => {
      if (badge) badge.textContent = count;
    });

    return items;
  });
}

// ================================
// SIDEBAR OPEN/CLOSE
// ================================

window.viewWishlist = function () {
  renderWishlistSidebar();

  document.getElementById("wishlistSidebar")?.classList.add("active");
  document.getElementById("wishlistOverlay")?.classList.add("active");

  document.getElementById("cartOverlay")?.classList.remove("active");
};

window.closeWishlist = function () {
  const sidebar = document.getElementById("wishlistSidebar");
  const overlay = document.getElementById("wishlistOverlay");

  if (sidebar) sidebar.classList.remove("active");
  if (overlay) overlay.classList.remove("active");

  // ✅ تأكد إنه body ما عليه overflow hidden
  document.body.style.overflow = "";
};

// ================================
// RENDER WISHLIST SIDEBAR
// ================================

function renderWishlistSidebar() {
  const container = document.getElementById("wishlistItemsContainer");
  if (!container) return;

  // Show loading
  container.innerHTML = `
    <div style="padding:40px;text-align:center;color:#777;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:40px;"></i>
      <p>Loading...</p>
    </div>
  `;

  fetchWishlistItems().then((items) => {
    container.innerHTML = "";

    // Update count
    const countEl = document.getElementById("wishlist-items-count");
    if (countEl) countEl.textContent = items ? items.length : 0;

    // Empty state
    if (!items || items.length === 0) {
      container.innerHTML = `
        <div style="padding:40px;text-align:center;color:#777;">
          <i class="fa-solid fa-heart" style="font-size:40px;margin-bottom:10px;opacity:0.3;"></i>
          <p style="margin:10px 0;"></p>
          <p style="font-size:14px;color:#999;"></p>
        </div>
      `;
      return;
    }

    // Render items
    items.forEach((product) => {
      const imgSrc = product.image || "/heels/heels/logo.png";
      const price = parseFloat(product.base_price || 0).toFixed(2);
      const category = product.category;

      const itemHTML = `
        <div class="cart-item wishlist-item" style="position:relative;">
          <div style="cursor:pointer;display:flex;width:100%;" 
               onclick="openWishlistProduct(${product.id})">
            <img src="${imgSrc}" 
                 alt="${escapeHtml(product.name)}" 
                 class="cart-item-image" 
                 style="width:100px;height:120px;object-fit:cover;border-radius:8px;">
            <div class="cart-item-details" style="flex:1;">
              <h4 class="cart-item-title">${escapeHtml(product.name)}</h4>
              <div class="cart-item-price">NIS ${price}</div>
              <div class="cart-item-info">
                <strong>Category:</strong> ${category}
              </div>
            </div>
          </div>
          <button class="cart-item-remove"
                  style="position:absolute;top:10px;right:10px;font-size:20px;line-height:1;background:rgba(255,255,255,0.9);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid #ddd;"
                  onclick="event.stopPropagation(); removeWishlistItem(${
                    product.id
                  });"
                  title="">
            &times;
          </button>
        </div>
      `;

      container.insertAdjacentHTML("beforeend", itemHTML);
    });
  });
}

// ================================
// OPEN PRODUCT FROM WISHLIST
// ================================

window.openWishlistProduct = function (productId) {
  window.location.href = "/heels/product.php?id=" + productId;
};

// ================================
// REMOVE FROM WISHLIST
// ================================

window.removeWishlistItem = function (productId) {
  wishlistToggle(productId).then((result) => {
    if (result) {
      updateWishlistCount();
      renderWishlistSidebar();

      // Show notification
      showWishlistNotification("Item deleted successfully");
    }
  });
};

// ================================
// TOGGLE WISHLIST (FOR PRODUCT PAGE)
// ================================

window.toggleWishlistDetail = function () {
  if (!window.currentProductData) return;

  const productId = currentProductData.id;
  const icon = document.getElementById("wishlistIconDetail");

  wishlistToggle(productId).then((result) => {
    if (!result) return;

    if (result.status === "added") {
      icon.classList.add("active");
    }

    if (result.status === "removed") {
      icon.classList.remove("active");
    }

    updateWishlistCount();
  });
};

// ================================
// CHECK IF PRODUCT IN WISHLIST
// (for product page heart icon)
// ================================

window.checkProductInWishlist = function (productId) {
  fetchWishlistItems().then((items) => {
    const icon = document.getElementById("wishlistIconDetail");
    if (!icon) return;

    const exists = items.some((item) => item.id == productId);
    if (exists) icon.classList.add("active");
    else icon.classList.remove("active");
  });
};

// ================================
// VIEW WISHLIST PAGE
// ================================

// ================================
// NOTIFICATION
// ================================

function showWishlistNotification(message) {
  // Remove existing notification
  const existing = document.getElementById("wishlist-notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.id = "wishlist-notification";
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #8C28B6 0%, #c0392b 100%);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 99999;
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

// ================================
// UTILITY
// ================================

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ================================
// INITIALIZE ON PAGE LOAD
// ================================

document.addEventListener("DOMContentLoaded", () => {
  // Update wishlist count
  updateWishlistCount();

  // If on product page, check if product is in wishlist
  if (window.currentProductData) {
    checkProductInWishlist(currentProductData.id);
  }

  console.log("✓ Wishlist system initialized");
});

// ================================
// CSS ANIMATIONS
// ================================

(function injectAnimations() {
  if (document.getElementById("wishlist-animations")) return;

  const style = document.createElement("style");
  style.id = "wishlist-animations";
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .wishlist-item {
      transition: all 0.3s ease;
    }
    
    .wishlist-item:hover {
      background: rgba(140, 40, 182, 0.05);
      transform: translateX(-5px);
    }
  `;
  document.head.appendChild(style);
})();

document.addEventListener("DOMContentLoaded", () => {
  updateWishlistCount();

  if (window.currentProductData) {
    checkProductInWishlist(currentProductData.id);
  }
});
