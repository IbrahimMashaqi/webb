<?php
// includes/header.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
$is_logged_in = isset($_SESSION['user_id']);
$user_name = $is_logged_in && isset($_SESSION['full_name']) ? $_SESSION['full_name'] : '';
$user_id = $is_logged_in ? $_SESSION['user_id'] : null;
?>

<div class="header-decoration"></div>

<div class="header">
  <div class="header-left">
    <a href="/heels/home.html">
      <img src="/heels/heels/logo1.png" alt="Logo" />
    </a>
  </div>

  <div class="header-right">
    <!-- Main Navigation -->
    <a href="/heels/home.html">Home</a>
    <a href="/heels/heels.html">Heels</a>
    <a href="/heels/bags.html">Bags</a>
    <a href="/heels/made_to_order.html">Bespoke</a>
    <a href="/heels/new-arrivals.html">New</a>
    <a href="/heels/sale.html">Sale</a>

    <!-- Secondary Navigation -->
    <a href="/heels/track_order.html">
      <i class="fa-solid fa-truck"></i>
      <span>Track Order</span>
    </a>

    <a href="/heels/store_locator.html">
      <i class="fa-solid fa-location-dot"></i>
      <span>Store Locator</span>
    </a>

    <a href="/heels/contact.html">
      <i class="fa-solid fa-phone"></i>
      <span>Contact</span>
    </a>

    <!-- Cart Badge -->
    <div class="icon-badge" onclick="toggleCart()">
      <i class="fa-solid fa-bag-shopping"></i>
      <span class="badge-pill" id="cart-count">0</span>
    </div>

    <!-- Wishlist Badge -->
    <div class="icon-badge" onclick="viewWishlist()">
      <i class="fa-solid fa-heart"></i>
      <span class="badge-pill" id="wishlist-count">0</span>
    </div>

    <!-- User Account -->
    <?php if ($is_logged_in): ?>
    <a href="/heels/account.html" id="user-link">
      <i class="fa-solid fa-user"></i>
      <span><?php echo htmlspecialchars($user_name); ?></span>
    </a>
    <?php else: ?>
    <a href="/heels/login.html" id="user-link">
      <i class="fa-solid fa-user"></i>
      <span>Login</span>
    </a>
    <?php endif; ?>

    <!-- Theme Toggle -->
    <div class="theme-toggle">
      <i class="fa-solid fa-moon"></i>
    </div>

    <!-- Mobile Menu Toggle -->
    <button class="toggle-sidebar">
      <i class="fa-solid fa-bars"></i>
    </button>
  </div>
</div>

<!-- CART SIDEBAR -->
<div id="cartSidebar" class="cart-sidebar">
  <div class="cart-header">
    <h2>MY BAG (<span id="cart-items-count">0</span>)</h2>
    <button class="cart-close" onclick="toggleCart()">&times;</button>
  </div>

  <div class="cart-items" id="cartItemsContainer">
    <div class="cart-empty">
      <i class="fa-solid fa-bag-shopping"></i>
      <p>Your bag is empty</p>
    </div>
  </div>

  <div class="cart-footer">
    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>Subtotal:</span>
        <span id="cartSubtotal">NIS 0.00</span>
      </div>
    </div>
    <button class="checkout-btn" onclick="proceedToCheckout()">CHECKOUT</button>
  </div>
</div>

<div id="cartOverlay" class="cart-overlay"></div>

<!-- WISHLIST SIDEBAR -->
<div id="wishlistSidebar" class="cart-sidebar wishlist-sidebar">
  <div class="cart-header">
    <h2>MY WISHLIST (<span id="wishlist-items-count">0</span>)</h2>
    <button class="cart-close" onclick="closeWishlist()">&times;</button>
  </div>

  <div class="cart-items" id="wishlistItemsContainer">
    <div class="cart-empty">
      <i class="fa-solid fa-heart"></i>
      <p>Your wishlist is empty</p>
    </div>
  </div>

  <div class="cart-footer">
    <button class="view-bag-btn" onclick="viewWishlistPage()">VIEW WISHLIST</button>
  </div>
</div>

<div id="wishlistOverlay" class="cart-overlay" onclick="closeWishlist()"></div>

<!-- Pass Session to JavaScript -->
<script>
window.userSession = {
  isLoggedIn: <?php echo $is_logged_in ? 'true' : 'false'; ?>,
  userName: <?php echo json_encode($user_name); ?>,
  userId: <?php echo $user_id ? $user_id : 'null'; ?>
};

function getCurrentUser() {
  return window.userSession.isLoggedIn ? window.userSession : null;
}

// Debug
console.log('Session:', window.userSession);
</script>