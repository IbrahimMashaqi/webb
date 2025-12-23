<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once "config.php";

try {
    // Fetch all bags products with their images
    $sql = "
    SELECT 
        p.id,
        p.name,
        p.description,
        p.base_price as price,
        p.is_new,
        p.is_on_sale,
        p.sale_percentage,
        p.created_at
    FROM products p
    WHERE p.category = 'BAGS'
    ORDER BY p.created_at DESC
    ";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $products = [];
    
    while ($row = $result->fetch_assoc()) {
        $productId = $row['id'];
        
        // Get all images for this product
        $imagesSql = "SELECT image_path FROM product_images WHERE product_id = ? ORDER BY id";
        $imagesStmt = $conn->prepare($imagesSql);
        $imagesStmt->bind_param("i", $productId);
        $imagesStmt->execute();
        $imagesResult = $imagesStmt->get_result();
        
        $images = [];
        while ($img = $imagesResult->fetch_assoc()) {
            $images[] = $img['image_path'];
        }
        
        // Get all variants (colors and sizes/categories) for this product
        $variantsSql = "SELECT DISTINCT size, color FROM product_variants WHERE product_id = ?";
        $variantsStmt = $conn->prepare($variantsSql);
        $variantsStmt->bind_param("i", $productId);
        $variantsStmt->execute();
        $variantsResult = $variantsStmt->get_result();
        
        $colors = [];
        $sizes = [];
        
        while ($variant = $variantsResult->fetch_assoc()) {
            if (!empty($variant['color']) && !in_array($variant['color'], $colors)) {
                $colors[] = $variant['color'];
            }
            if (!empty($variant['size']) && !in_array($variant['size'], $sizes)) {
                $sizes[] = $variant['size'];
            }
        }
        
        // Calculate final price if on sale
        $finalPrice = $row['price'];
        if ($row['is_on_sale'] && $row['sale_percentage'] > 0) {
            $finalPrice = $row['price'] * (1 - $row['sale_percentage'] / 100);
        }
        
        $products[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'price' => number_format($finalPrice, 2, '.', ''),
            'originalPrice' => number_format($row['price'], 2, '.', ''),
            'isNew' => (bool)$row['is_new'],
            'isOnSale' => (bool)$row['is_on_sale'],
            'salePercentage' => $row['sale_percentage'],
            'images' => $images,
            'colors' => $colors,
            'sizes' => $sizes,
            'createdAt' => $row['created_at']
        ];
    }
    
    echo json_encode($products);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>