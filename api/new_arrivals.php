<?php
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
error_reporting(E_ALL);

// DB CONNECTION
$conn = new mysqli("localhost", "root", "", "stilletto");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

/*
  المنتج جديد إذا:
  created_at >= NOW() - INTERVAL 3 DAY
*/

$sql = "
SELECT
    p.id,
    p.name,
    p.category,
    p.base_price,
    p.created_at,
    MIN(pi.image_path) AS image
FROM products p
LEFT JOIN product_images pi 
    ON p.id = pi.product_id
WHERE p.created_at >= NOW() - INTERVAL 3 DAY
GROUP BY p.id
ORDER BY p.created_at DESC
";

$result = $conn->query($sql);

$data = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = [
            "id"       => $row["id"],
            "name"     => $row["name"],
            "category" => strtolower($row["category"]), // heels / bags
            "price"    => $row["base_price"],
            "image"    => $row["image"],
            "date"     => $row["created_at"]
        ];
    }
}

echo json_encode($data);
