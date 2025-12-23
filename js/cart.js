// ============================================
// COMPLETE CART SYSTEM - Database Version
// ============================================

// API Path
const CART_API = "/heels/api/cart_api.php";

// Cart state
let cartItems = [];
let wishlistItems = [];

// Initialize cart from database
async function initializeCart() {
  await loadCartFromDatabase();
  loadWishlistFromLocalStorage();
  updateCartDisplay();
  updateWishlistDisplay();
}

// Load cart from database
async function loadCartFromDatabase() {
  try {
    const response = await fetch(`${CART_API}?action=get`);
    const data = await response.json();

    console.log("Cart API Response:", data); // Debug

    if (data.success) {
      cartItems = data.items || [];
      console.log("Cart Items Loaded:", cartItems.length); // Debug
    } else {
      console.warn("Cart error:", data.error);
      cartItems = [];
    }
  } catch (error) {
    console.error("Error loading cart:", error);
    cartItems = [];
  }
}

// Load wishlist from localStorage
function loadWishlistFromLocalStorage() {
  const savedWishlist = localStorage.getItem("stilleto_wishlist");
  if (savedWishlist) {
    try {
      wishlistItems = JSON.parse(savedWishlist);
    } catch (e) {
      console.error("Error loading wishlist:", e);
      wishlistItems = [];
    }
  }
}

// Save wishlist to localStorage
function saveWishlist() {
  localStorage.setItem("stilleto_wishlist", JSON.stringify(wishlistItems));
  updateWishlistDisplay();
}

// Add item to cart
window.addToCartGlobal = async function (item) {
  // Check if logged in
  if (!window.userSession || !window.userSession.isLoggedIn) {
    alert("Please login to add items to cart");
    window.location.href = "/heels/login.html";
    return false;
  }

  if (!item.variant_id) {
    alert("Please select size and color");
    return false;
  }

  try {
    const response = await fetch(`${CART_API}?action=add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variant_id: item.variant_id,
        quantity: item.quantity || 1,
      }),
    });

    const data = await response.json();

    if (data.success) {
      await loadCartFromDatabase();
      animateBadge("cart-count");
      showNotification("✓ Added to cart!");
      return true;
    } else {
      alert(data.error || "Error adding to cart");
      return false;
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    alert("Error adding to cart");
    return false;
  }
};

// Update cart quantity
window.updateCartQuantity = async function (itemId, change) {
  const item = cartItems.find((i) => i.id === itemId);
  if (!item) return;

  const newQuantity = item.quantity + change;

  try {
    const response = await fetch(`${CART_API}?action=update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item_id: itemId,
        quantity: newQuantity,
      }),
    });

    const data = await response.json();

    if (data.success) {
      await loadCartFromDatabase();
    } else {
      alert(data.error || "Error updating quantity");
    }
  } catch (error) {
    console.error("Error updating quantity:", error);
  }
};

// Remove item from cart
window.removeFromCart = async function (itemId) {
  if (!confirm("Remove this item from cart?")) return;

  try {
    const response = await fetch(`${CART_API}?action=remove&item_id=${itemId}`);
    const data = await response.json();

    if (data.success) {
      await loadCartFromDatabase();
      showNotification("Item removed");
    } else {
      alert(data.error || "Error removing item");
    }
  } catch (error) {
    console.error("Error removing item:", error);
  }
};

// Get cart total
function getCartTotal() {
  return cartItems.reduce((total, item) => {
    const price = parseFloat(item.price.replace(/[^\d.]/g, ""));
    return total + price * item.quantity;
  }, 0);
}

// Update cart display
window.updateCartDisplay = function () {
  const cartItemsContainer = document.getElementById("cartItemsContainer");
  const cartItemsCount = document.getElementById("cart-items-count");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartCountBadge = document.getElementById("cart-count");

  if (!cartItemsContainer) return;

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cartItemsCount) cartItemsCount.textContent = totalItems;
  if (cartCountBadge) cartCountBadge.textContent = totalItems;

  if (cartItems.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-bag-shopping"></i>
        <p>Your bag is empty</p>
      </div>
    `;
    if (cartSubtotal) cartSubtotal.textContent = "NIS 0.00";
    return;
  }

  const subtotal = getCartTotal();
  cartItemsContainer.innerHTML = "";

  cartItems.forEach((item) => {
    const cartItemHTML = `
      <div class="cart-item" onclick="goToProduct(${
        item.product_id
      })" style="cursor: pointer;">
        <img src="${item.image}" alt="${
      item.title
    }" class="cart-item-image" onerror="this.src='/heels/images/placeholder.jpg'">
        <div class="cart-item-details">
          <h3 class="cart-item-title">${item.title}</h3>
          <div class="cart-item-price">${item.price}</div>
          ${
            item.color
              ? `<div class="cart-item-info"><strong>Color:</strong> ${item.color}</div>`
              : ""
          }
          <div class="cart-item-info"><strong>Size:</strong> ${item.size}</div>
          <div class="cart-item-controls" onclick="event.stopPropagation()">
            <div class="cart-quantity-controls">
              <button class="cart-quantity-btn" onclick="updateCartQuantity(${
                item.id
              }, -1)">−</button>
              <span class="cart-quantity-display">${item.quantity}</span>
              <button class="cart-quantity-btn" onclick="updateCartQuantity(${
                item.id
              }, 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${
              item.id
            })">Remove</button>
          </div>
        </div>
      </div>
    `;

    cartItemsContainer.innerHTML += cartItemHTML;
  });

  if (cartSubtotal) cartSubtotal.textContent = `NIS ${subtotal.toFixed(2)}`;
};

// Toggle cart sidebar
window.toggleCart = async function () {
  const cart = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay");

  if (!cart || !overlay) {
    console.error("Cart elements not found!");
    return;
  }

  const isOpen = cart.classList.contains("active");

  if (isOpen) {
    cart.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  } else {
    // Check if logged in
    if (!window.userSession || !window.userSession.isLoggedIn) {
      alert("Please login to view your cart");
      window.location.href = "/heels/login.html";
      return;
    }

    await loadCartFromDatabase();
    cart.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

// Wishlist functions
window.toggleWishlistItem = function (productId) {
  const index = wishlistItems.indexOf(productId);

  if (index >= 0) {
    wishlistItems.splice(index, 1);
  } else {
    wishlistItems.push(productId);
  }

  saveWishlist();
  return index < 0;
};

// Update wishlist display
function updateWishlistDisplay() {
  const wishlistBadge = document.getElementById("wishlist-count");
  if (wishlistBadge) {
    wishlistBadge.textContent = wishlistItems.length;
  }
}

// View wishlist
window.viewWishlist = function () {
  const sidebar = document.getElementById("wishlistSidebar");
  const overlay = document.getElementById("wishlistOverlay");

  if (sidebar && overlay) {
    sidebar.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};

// Close wishlist
window.closeWishlist = function () {
  const sidebar = document.getElementById("wishlistSidebar");
  const overlay = document.getElementById("wishlistOverlay");

  if (sidebar && overlay) {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
};

// View wishlist page
window.viewWishlistPage = function () {
  window.location.href = "/heels/wishlist.html";
};

// Go to product page
window.goToProduct = function (productId) {
  window.location.href = `/heels/api/product.php?id=${productId}`;
};

// Animate badge
function animateBadge(id) {
  const badge = document.getElementById(id);
  if (!badge) return;
  badge.classList.add("animate");
  setTimeout(() => badge.classList.remove("animate"), 300);
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2500);
}

// Proceed to checkout
window.proceedToCheckout = function () {
  if (cartItems.length === 0) {
    alert(
      "Your cart is empty!\n\nPlease add items to your cart before checking out."
    );
    toggleCart();
    return;
  }

  window.location.href = "/heels/checkout.html";
};

// View bag
window.viewBag = function () {
  if (cartItems.length === 0) {
    alert(
      "Your bag is empty!\n\nBrowse our collections and add items to your bag."
    );
    toggleCart();
    return;
  }

  const total = getCartTotal();
  const itemsList = cartItems
    .map(
      (item, index) =>
        `${index + 1}. ${item.title}\n` +
        `   Size: ${item.size}${item.color ? `, Color: ${item.color}` : ""}\n` +
        `   Qty: ${item.quantity} × ${item.price}`
    )
    .join("\n\n");

  alert(
    `YOUR SHOPPING BAG\n\n${itemsList}\n\n` +
      `────────────────────\n` +
      `Subtotal: NIS ${total.toFixed(2)}\n` +
      `Shipping: FREE\n` +
      `────────────────────\n` +
      `TOTAL: NIS ${total.toFixed(2)}`
  );
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Cart system initializing...");
  initializeCart();

  // Setup cart overlay close
  const cartOverlay = document.getElementById("cartOverlay");
  if (cartOverlay) {
    cartOverlay.onclick = function () {
      toggleCart();
    };
  }

  // Setup cart close button
  const cartClose = document.querySelector(".cart-close");
  if (cartClose) {
    cartClose.onclick = function () {
      toggleCart();
    };
  }
});

// Clear cart
window.clearCart = function () {
  cartItems = [];
  updateCartDisplay();
};

// Get cart items
window.getCartItems = function () {
  return cartItems;
};

// Refresh cart
window.refreshCart = async function () {
  await loadCartFromDatabase();
};

// Add CSS animation
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .badge-pill.animate {
    animation: pulse 0.3s ease;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
  }
`;
document.head.appendChild(style);

console.log("✓ Cart system loaded");
