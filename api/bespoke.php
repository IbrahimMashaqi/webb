<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  echo json_encode(["ok" => true]);
  exit;
}

/* =======================
   DB CONFIG
======================= */
$conn = new mysqli("localhost", "root", "", "stilletto");
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["error" => "DB connection failed"]);
  exit;
}

/* =======================
   HELPERS
======================= */
function read_json_body() {
  return json_decode(file_get_contents("php://input"), true) ?? [];
}

function bad($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(["error" => $msg]);
  exit;
}

/* =======================
   GET  → load options + images
======================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

  $heels = [];
  $materials = [];
  $colors = [];
  $images = [];

  // HEELS
  $res = $conn->query("SELECT label, height_mm, price, image_path FROM bespoke_heel_heights WHERE active=1 ORDER BY sort_order");
  while ($r = $res->fetch_assoc()) {
    $heels[] = [
      "label" => $r["label"],
      "height_mm" => (int)$r["height_mm"],
      "price" => (float)$r["price"],
      "image" => $r["image_path"]
    ];
  }

  // MATERIALS
  $res = $conn->query("SELECT name, extra_price, image_path, allowed_heights_json FROM bespoke_materials WHERE active=1 ORDER BY sort_order");
  while ($r = $res->fetch_assoc()) {
    $materials[] = [
      "name" => $r["name"],
      "extra_price" => (float)$r["extra_price"],
      "image" => $r["image_path"],
      "allowed_heights" => json_decode($r["allowed_heights_json"], true) ?? []
    ];
  }

  // COLORS
  $res = $conn->query("SELECT material_name, name, value, hex FROM bespoke_colors WHERE active=1 ORDER BY sort_order");
  while ($r = $res->fetch_assoc()) {
    $colors[] = [
      "material" => $r["material_name"],
      "name" => $r["name"],
      "value" => $r["value"],
      "hex" => $r["hex"]
    ];
  }

  // IMAGES ⭐⭐⭐
  $res = $conn->query("SELECT material, heel_height, color, image_path FROM bespoke_images");
  while ($r = $res->fetch_assoc()) {
    $images[] = [
      "material" => $r["material"],
      "heel_height" => (int)$r["heel_height"],
      "color" => $r["color"],
      "image_path" => $r["image_path"]
    ];
  }

  echo json_encode([
    "heels" => $heels,
    "materials" => $materials,
    "colors" => $colors,
    "images" => $images
  ]);
  exit;
}

/* =======================
   POST → save order
======================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

  $d = read_json_body();

  if (empty($d["user_id"])) bad("Login required");
  if (empty($d["heel_height"]) || empty($d["material"]) || empty($d["color"]) || empty($d["size"]))
    bad("Missing fields");

  $stmt = $conn->prepare(
    "INSERT INTO bespoke_orders (user_id, heel_height, material, color, size, price, status)
     VALUES (?, ?, ?, ?, ?, ?, 'DESIGN')"
  );

  $price = 0; // السعر محسوب بالـ JS مسبقًا
  $stmt->bind_param(
    "iisssd",
    $d["user_id"],
    $d["heel_height"],
    $d["material"],
    $d["color"],
    $d["size"],
    $price
  );

  if (!$stmt->execute()) bad("Insert failed", 500);

  echo json_encode([
    "ok" => true,
    "order_id" => $stmt->insert_id
  ]);
  exit;
}

bad("Method not allowed", 405);
