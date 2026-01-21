<?php
$data = json_decode(file_get_contents("php://input"), true);

$user = $data['user'];
$task = $data['task'];

$token = bin2hex(random_bytes(16));

$db = json_decode(file_get_contents("data.json"), true);

$db['tokens'][$token] = [
  "user" => $user,
  "task" => $task,
  "used" => false
];

file_put_contents("data.json", json_encode($db));

$link = "https://your-shortlink.com/?redirect=https://yourdomain.com/callback.php?token=$token";

echo json_encode([
  "token" => $token,
  "link" => $link
]);