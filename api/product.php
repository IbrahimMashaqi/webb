<?php
require_once __DIR__ . "/config.php";
session_start(); // ✅ هذا السطر كان ناقص

// Get product ID from URL
$product_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($product_id <= 0) {
    header("Location: /heels/home.html");
    exit;
}

// Fetch product details with all images
$sql = "
SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.base_price,
    p.is_new,
    p.is_on_sale,
    p.sale_percentage
FROM products p
WHERE p.id = ?
";

$stmt = $mysqli->prepare($sql);
$stmt->bind_param("i", $product_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    header("Location: /heels/home.html");
    exit;
}

$product = $result->fetch_assoc();

// Calculate final price if on sale
$final_price = $product['base_price'];
if ($product['is_on_sale'] && $product['sale_percentage'] > 0) {
    $final_price = $product['base_price'] * (1 - $product['sale_percentage'] / 100);
}

// Fetch all product images
$images_sql = "SELECT image_path FROM product_images WHERE product_id = ? ORDER BY id";
$images_stmt = $mysqli->prepare($images_sql);
$images_stmt->bind_param("i", $product_id);
$images_stmt->execute();
$images_result = $images_stmt->get_result();

$images = [];
while ($img = $images_result->fetch_assoc()) {
    $images[] = "/heels/" . $img['image_path'];
}

// Fetch product variants (colors and sizes)
$variants_sql = "SELECT DISTINCT size, color, stock FROM product_variants WHERE product_id = ? ORDER BY size, color";
$variants_stmt = $mysqli->prepare($variants_sql);
$variants_stmt->bind_param("i", $product_id);
$variants_stmt->execute();
$variants_result = $variants_stmt->get_result();

$sizes = [];
$colors = [];
while ($variant = $variants_result->fetch_assoc()) {
    if (!empty($variant['size']) && !in_array($variant['size'], $sizes)) {
        $sizes[] = $variant['size'];
    }
    if (!empty($variant['color']) && !in_array($variant['color'], $colors)) {
        $colors[] = $variant['color'];
    }
}

$category_name = $product['category'] === 'HEELS' ? 'Heels' : 'Bags';
$category_link = $product['category'] === 'HEELS' ? 'heels.html' : 'bags.html';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title><?php echo htmlspecialchars($product['name']); ?> - Stilleto</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="/heels/css/index.css">
</head>
<body>
    <div class="header-decoration"></div>

    <div class="header">
        <div class="header-left">
            <a href="/heels/home.html">
                <img src="/heels/heels/logo1.png" alt="Logo">
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
            <a href="/heels/track_order.html"><i class="fa-solid fa-truck"></i> <span>Track Order</span></a>
            <a href="/heels/store_locator.html"><i class="fa-solid fa-location-dot"></i> <span>Store Locator</span></a>
            <a href="/heels/contact.html"><i class="fa-solid fa-phone"></i> <span>Contact</span></a>
        
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
            <a href="/heels/login.html" id="user-link"><i class="fa-solid fa-user"></i> <span>Login</span></a>
            
            <!-- Theme Toggle -->
            <div class="theme-toggle"><i class="fa-solid fa-moon"></i></div>
            
            <!-- Mobile Menu Toggle -->
            <button class="toggle-sidebar"><i class="fa-solid fa-bars"></i></button>
        </div>
    </div>

    <!-- PRODUCT DETAIL PAGE -->
    <div class="breadcrumb">
        <a href="/heels/home.html">Home</a>
        <span>/</span>
        <a href="/heels/<?php echo $category_link; ?>"><?php echo $category_name; ?></a>
        <span>/</span>
        <span><?php echo htmlspecialchars($product['name']); ?></span>
    </div>

    <div class="product-container">
        <div class="product-gallery">
            <img src="<?php echo !empty($images) ? $images[0] : '/heels/heels/logo.png'; ?>" 
                 alt="<?php echo htmlspecialchars($product['name']); ?>" 
                 class="main-image" 
                 id="mainImage">
            
            <?php if (count($images) > 1): ?>
            <div class="thumbnail-container">
                <?php foreach ($images as $index => $image): ?>
                <img src="<?php echo $image; ?>" 
                     class="thumbnail <?php echo $index === 0 ? 'active' : ''; ?>" 
                     onclick="changeImage(this)">
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>

        <div class="product-details">
            <h1 class="product-title"><?php echo htmlspecialchars($product['name']); ?></h1>
            
            <div class="product-rating">
                <div class="stars">★★★★★</div>
                <span class="review-count">(127 Reviews)</span>
            </div>

            <div class="product-price">
                <?php if ($product['is_on_sale'] && $product['sale_percentage'] > 0): ?>
                    <span style="text-decoration: line-through; color: #95a5a6; font-size: 24px; margin-right: 15px;">
                        NIS <?php echo number_format($product['base_price'], 2); ?>
                    </span>
                    <span style="color: #e74c3c;">NIS <?php echo number_format($final_price, 2); ?></span>
                    <span style="background: #e74c3c; color: white; padding: 5px 10px; border-radius: 5px; font-size: 14px; margin-left: 10px;">
                        -<?php echo $product['sale_percentage']; ?>%
                    </span>
                <?php else: ?>
                    NIS <?php echo number_format($final_price, 2); ?>
                <?php endif; ?>
            </div>

            <div class="product-description">
                <p><?php echo nl2br(htmlspecialchars($product['description'])); ?></p>
            </div>

            <div class="product-meta">
                <div class="product-meta-item">
                    <strong>SKU:</strong>
                    <span><?php echo strtoupper($product['category']) . '-' . str_pad($product['id'], 3, '0', STR_PAD_LEFT); ?></span>
                </div>
                <div class="product-meta-item">
                    <strong>Availability:</strong>
                    <span style="color: #27ae60; font-weight: 600;">In Stock</span>
                </div>
                <div class="product-meta-item">
                    <strong>Category:</strong>
                    <span><?php echo $category_name; ?></span>
                </div>
                <div class="product-meta-item">
                    <strong>Material:</strong>
                    <span>100% Premium Leather</span>
                </div>
                <div class="product-meta-item">
                    <strong>Origin:</strong>
                    <span><?php echo $product['category'] === 'HEELS' ? 'Italy' : 'Scotland'; ?> - Handmade</span>
                </div>
            </div>

            <?php if (!empty($colors)): ?>
            <div class="color-selector">
                <h4>Color: <span id="selectedColorName"><?php echo ucfirst($colors[0]); ?></span></h4>
                <div class="color-options" id="colorOptions">
                    <?php foreach ($colors as $index => $color): ?>
                    <div class="color-option <?php echo $index === 0 ? 'active' : ''; ?>" 
                         data-color="<?php echo htmlspecialchars($color); ?>" 
                         title="<?php echo ucfirst(htmlspecialchars($color)); ?>"
                         onclick="selectColor(this)"></div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <?php if (!empty($sizes)): ?>
            <div class="size-selector">
                <h4><?php echo $product['category'] === 'HEELS' ? 'Select Size' : 'Category'; ?></h4>
                <div class="size-options" id="sizeOptions">
                    <?php foreach ($sizes as $index => $size): ?>
                    <div class="size-option <?php echo $index === 0 ? 'active' : ''; ?>" 
                         onclick="selectSize(this)"><?php echo htmlspecialchars($size); ?></div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <div class="quantity-selector">
                <h4>Quantity</h4>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="decreaseQuantity()">-</button>
                    <div class="quantity-display" id="quantity">1</div>
                    <button class="quantity-btn" onclick="increaseQuantity()">+</button>
                </div>
            </div>

            <div class="action-buttons">
                <button class="btn-primary" onclick="addToCartFromDetail()">
                    <i class="fa-solid fa-cart-shopping"></i> Add to Cart
                </button>
                <button class="btn-secondary" onclick="toggleWishlistDetail()">
                    <i class="fa-solid fa-heart" id="wishlistIconDetail"></i>
                </button>
            </div>

            <div class="features-list">
                <h4>Product Features</h4>
                <div class="feature-item">
                    <i class="fa-solid fa-truck"></i>
                    <span>Free Shipping on orders over NIS 300</span>
                </div>
                <div class="feature-item">
                    <i class="fa-solid fa-rotate-left"></i>
                    <span>30-Day Return Policy</span>
                </div>
                <div class="feature-item">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span>Authentic <?php echo $product['category'] === 'HEELS' ? 'Italian' : 'Scottish'; ?> Craftsmanship</span>
                </div>
                <div class="feature-item">
                    <i class="fa-solid fa-hand-sparkles"></i>
                    <span>Hand-Made by Skilled Artisans</span>
                </div>
                <div class="feature-item">
                    <i class="fa-solid fa-certificate"></i>
                    <span>Quality Guaranteed</span>
                </div>
            </div>
        </div>
    </div>

    <!-- CART SIDEBAR -->
    <div id="cartSidebar" class="cart-sidebar">
        <div class="cart-header">
            <h2>MY BAG (<span id="cart-items-count">0</span>)</h2>
            <button class="cart-close" onclick="toggleCart()">&times;</button>
        </div>

        <div class="cart-items" id="cartItemsContainer">
            <!-- items injected by JS -->
        </div>

        <div class="cart-footer">
            <div class="cart-subtotal">
                <span>SUBTOTAL</span>
                <span class="subtotal-amount" id="cartSubtotal">NIS 0.00</span>
            </div>

            <button class="checkout-btn" onclick="proceedToCheckout()">
                CHECKOUT
            </button>

            <button class="view-bag-btn" onclick="viewBag()">
                VIEW BAG
            </button>
        </div>
    </div>

    <div id="cartOverlay" class="cart-overlay" onclick="toggleCart()"></div>

    <!-- WISHLIST SIDEBAR -->
    <div id="wishlistSidebar" class="cart-sidebar wishlist-sidebar">
        <div class="cart-header">
            <h2>MY WISHLIST (<span id="wishlist-items-count">0</span>)</h2>
            <button class="cart-close" onclick="closeWishlist()">&times;</button>
        </div>

        <div class="cart-items" id="wishlistItemsContainer">
            <!-- wishlist items injected by JS -->
        </div>

        <div class="cart-footer">
            <button class="view-bag-btn" onclick="viewWishlistPage()">
                VIEW WISHLIST
            </button>
        </div>
    </div>

    <div id="wishlistOverlay" class="cart-overlay" onclick="closeWishlist()"></div>

    <footer>
        <p>&copy; 2025 Stilleto | All rights reserved.</p>
    </footer>

    <!-- SCRIPTS - ORDER IS CRITICAL -->
   <script src="/heels/js/auth.js"></script>
<script src="/heels/js/global-functions.js"></script>
<script src="/heels/js/cart.js"></script>
<script src="/heels/js/wishlist.js"></script>
<script src="/heels/js/product.js"></script>

    <script>
  // ✅ لازم تكون على window عشان كل الملفات تشوفها
  window.currentProductData = {
    id: <?php echo $product['id']; ?>,
    name: <?php echo json_encode($product['name']); ?>,
    price: <?php echo $final_price; ?>,
    originalPrice: <?php echo $product['base_price']; ?>,
    isOnSale: <?php echo $product['is_on_sale'] ? 'true' : 'false'; ?>,
    salePercentage: <?php echo (int)$product['sale_percentage']; ?>,
    category: <?php echo json_encode($product['category']); ?>,
    images: <?php echo json_encode($images); ?>,
    colors: <?php echo json_encode($colors); ?>,
    sizes: <?php echo json_encode($sizes); ?>
  };

  // ✅ خليهم globals كمان (عشان product.js)
  window.quantity = 1;
  window.selectedSize = <?php echo !empty($sizes) ? json_encode($sizes[0]) : 'null'; ?>;
  window.selectedColor = <?php echo !empty($colors) ? json_encode($colors[0]) : 'null'; ?>;

  // ✅ بعد ما عرفنا الداتا: افحص اذا المنتج موجود بالويش ليست عشان تعلم القلب
  if (typeof window.checkProductInWishlist === "function") {
    window.checkProductInWishlist(window.currentProductData.id);
  }
</script>

    
</body>
</html>