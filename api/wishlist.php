<?php
require_once __DIR__ . "/config.php";
session_start();

header("Content-Type: application/json");

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "NOT_LOGGED_IN"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

/* =========================
   ADD / REMOVE (TOGGLE)
========================= */
if ($action === "toggle") {
    $product_id = intval($_POST['product_id']);

    $check = $mysqli->prepare(
        "SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?"
    );
    $check->bind_param("ii", $user_id, $product_id);
    $check->execute();
    $res = $check->get_result();

    if ($res->num_rows > 0) {
        // REMOVE
        $del = $mysqli->prepare(
            "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?"
        );
        $del->bind_param("ii", $user_id, $product_id);
        $del->execute();

        echo json_encode(["status" => "removed"]);
    } else {
        // ADD
        $add = $mysqli->prepare(
            "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)"
        );
        error_log("Wishlist added: user=$user_id product=$product_id");

        $add->bind_param("ii", $user_id, $product_id);
        $add->execute();

        echo json_encode(["status" => "added"]);
    }
    exit;
}

/* =========================
   FETCH WISHLIST ITEMS
========================= */
$sql = "
SELECT 
  p.id,
  p.name,
  p.base_price,
  p.category,
  (
    SELECT image_path
    FROM product_images
    WHERE product_id = p.id
    ORDER BY id ASC
    LIMIT 1
  ) AS image_path
FROM wishlist w
JOIN products p ON p.id = w.product_id
WHERE w.user_id = ?

";

$stmt = $mysqli->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$items = [];
while ($row = $result->fetch_assoc()) {

    $row['image'] = "/heels/" . $row['image_path'];


    unset($row['image_path']); // تنظيف
    $items[] = $row;
}

echo json_encode($items);
exit;


