<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

$BASE_URL = "/heels/"; // عدّلها إذا مسار مشروعك مختلف

$conn = new mysqli("localhost", "root", "", "stilletto");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}

/*
  IMPORTANT:
  This API expects:
  - products.is_on_sale (tinyint)
  - products.sale_percentage (int 0..100)
  - products.base_price
*/
$sql = "
SELECT
    p.id,
    p.name,
    p.description,
    p.category,
    p.base_price,
    p.sale_percentage,
    pi.image_path
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_on_sale = 1
ORDER BY p.id, pi.id
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(["sql_error" => $conn->error]);
    exit;
}

$products = [];

while ($row = $result->fetch_assoc()) {
    $id = (int)$row['id'];

    if (!isset($products[$id])) {
        $original = (float)$row['base_price'];
        $percent  = (int)$row['sale_percentage'];
        if ($percent < 0) $percent = 0;
        if ($percent > 100) $percent = 100;

        $sale = $percent > 0 ? round($original * (1 - $percent / 100), 2) : $original;

        $products[$id] = [
            "id" => $id,
            "title" => $row['name'],
            "description" => $row['description'],
            "category" => $row['category'],
            "original_price" => $original,
            "sale_price" => $sale,
            "discount_percentage" => $percent,
            "image" => null,
            "images" => []
        ];
    }

    if (!empty($row['image_path'])) {
        $products[$id]["images"][] = $BASE_URL . $row['image_path'];
    }
}

// set main image
foreach ($products as &$p) {
    if (!empty($p["images"])) {
        $p["image"] = $p["images"][0];
    } else {
        $p["image"] = $BASE_URL . "placeholder.png"; // حط صورة placeholder عندك
    }
}

echo json_encode(array_values($products), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$conn->close();
