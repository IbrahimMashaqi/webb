<?php
// api/cart_api.php
header('Content-Type: application/json');
require_once 'config.php';
session_start();

$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
$action = isset($_GET['action']) ? $_GET['action'] : '';

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'Please login']);
    exit;
}

// Get or create cart
function getCartId($conn, $user_id) {
    $stmt = $conn->prepare("SELECT id FROM carts WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        return $row['id'];
    }
    
    $stmt = $conn->prepare("INSERT INTO carts (user_id) VALUES (?)");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    return $conn->insert_id;
}

switch($action) {
    case 'get':
        $cart_id = getCartId($conn, $user_id);
        
        $query = "SELECT ci.id, ci.quantity, 
                         p.id as product_id, p.name, pv.size, pv.color, pv.price, pv.stock,
                         (SELECT image_path FROM product_images WHERE product_id = p.id LIMIT 1) as image_path
                  FROM cart_items ci
                  JOIN product_variants pv ON ci.variant_id = pv.id
                  JOIN products p ON pv.product_id = p.id
                  WHERE ci.cart_id = ?";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $cart_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = [
                'id' => $row['id'],
                'product_id' => $row['product_id'],
                'title' => $row['name'],
                'price' => 'NIS ' . number_format($row['price'], 2),
                'size' => $row['size'],
                'color' => $row['color'],
                'quantity' => $row['quantity'],
                'image' => $row['image_path'] ?: '/heels/images/placeholder.jpg'
            ];
        }
        
        echo json_encode(['success' => true, 'items' => $items]);
        break;

    case 'add':
        $data = json_decode(file_get_contents('php://input'), true);
        $variant_id = intval($data['variant_id']);
        $quantity = intval($data['quantity'] ?: 1);
        
        $cart_id = getCartId($conn, $user_id);
        
        // Check if exists
        $stmt = $conn->prepare("SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?");
        $stmt->bind_param("ii", $cart_id, $variant_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($existing = $result->fetch_assoc()) {
            $new_qty = $existing['quantity'] + $quantity;
            $stmt = $conn->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
            $stmt->bind_param("ii", $new_qty, $existing['id']);
        } else {
            $stmt = $conn->prepare("INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $cart_id, $variant_id, $quantity);
        }
        
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;

    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $item_id = intval($data['item_id']);
        $quantity = intval($data['quantity']);
        
        if ($quantity <= 0) {
            $stmt = $conn->prepare("DELETE FROM cart_items WHERE id = ?");
            $stmt->bind_param("i", $item_id);
        } else {
            $stmt = $conn->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
            $stmt->bind_param("ii", $quantity, $item_id);
        }
        
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;

    case 'remove':
        $item_id = intval($_GET['item_id']);
        $stmt = $conn->prepare("DELETE FROM cart_items WHERE id = ?");
        $stmt->bind_param("i", $item_id);
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
}

$conn->close();
?>