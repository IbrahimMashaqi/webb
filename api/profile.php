<?php
session_start();
header("Content-Type: application/json");

// ================= DB =================
$conn = new mysqli("localhost", "root", "", "stilletto");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}

// ================= AUTH =================
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Not logged in"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

// ================= ROUTER =================
switch ($action) {

    case "get_profile":
        getProfile($conn, $user_id);
        break;

    case "update_profile":
        updateProfile($conn, $user_id);
        break;

    case "change_password":
        changePassword($conn, $user_id);
        break;

    case "upload_avatar":
        uploadAvatar($conn, $user_id);
        break;

    default:
        echo json_encode(["error" => "Invalid action"]);
}
exit;


// ================= FUNCTIONS =================

function getProfile($conn, $user_id) {
    $sql = "SELECT full_name, email, phone, profile_image, created_at
            FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $u = $stmt->get_result()->fetch_assoc();

    if (!$u) {
        echo json_encode(["error" => "User not found"]);
        return;
    }

    // split full_name → first + last (للـ JS)
    $nameParts = explode(" ", $u['full_name'], 2);

    echo json_encode([
        "firstName" => $nameParts[0],
        "lastName"  => $nameParts[1] ?? "",
        "email"     => $u['email'],
        "phone"     => $u['phone'],
        "avatar"    => $u['profile_image'],
        "registeredDate" => $u['created_at']
    ]);
}

function updateProfile($conn, $user_id) {
    $data = json_decode(file_get_contents("php://input"), true);

    $full_name = trim($data['firstName'] . " " . $data['lastName']);

    $sql = "UPDATE users 
            SET full_name = ?, email = ?, phone = ?
            WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        "sssi",
        $full_name,
        $data['email'],
        $data['phone'],
        $user_id
    );
    $stmt->execute();

    echo json_encode(["success" => true]);
}

function changePassword($conn, $user_id) {
    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $conn->prepare(
        "SELECT password_hash FROM users WHERE id = ?"
    );
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!password_verify($data['currentPassword'], $row['password_hash'])) {
        echo json_encode(["error" => "Current password is incorrect"]);
        return;
    }

    $newHash = password_hash($data['newPassword'], PASSWORD_DEFAULT);

    $stmt = $conn->prepare(
        "UPDATE users SET password_hash = ? WHERE id = ?"
    );
    $stmt->bind_param("si", $newHash, $user_id);
    $stmt->execute();

    echo json_encode(["success" => true]);
}

function uploadAvatar($conn, $user_id) {
    if (!isset($_FILES['avatar'])) {
        echo json_encode(["error" => "No file uploaded"]);
        return;
    }

    $dir = "../uploads/avatars/";
    if (!is_dir($dir)) mkdir($dir, 0777, true);

    $filename = uniqid() . "_" . basename($_FILES['avatar']['name']);
    $path = $dir . $filename;

    move_uploaded_file($_FILES['avatar']['tmp_name'], $path);

    $dbPath = "uploads/avatars/" . $filename;

    $stmt = $conn->prepare(
        "UPDATE users SET profile_image = ? WHERE id = ?"
    );
    $stmt->bind_param("si", $dbPath, $user_id);
    $stmt->execute();

    echo json_encode(["path" => $dbPath]);
}
