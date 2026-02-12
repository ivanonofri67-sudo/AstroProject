<?php
header('Content-Type: application/json');
$host = "localhost";
$user = "root";
$pass = "";
$db   = "astroproject";

$conn = new mysqli($host, $user, $pass, $db);

// Parametri dalla richiesta GET
$limit  = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$page   = isset($_GET['p']) ? (int)$_GET['p'] : 1;
$offset = ($page - 1) * $limit;
$sort   = isset($_GET['sort']) ? $_GET['sort'] : 'name';
$order  = isset($_GET['order']) ? $_GET['order'] : 'ASC';

// Esempio base Query (Aggiungi qui la logica WHERE per i filtri se necessario)
$sql = "SSELECT * FROM esopianeti ORDER BY $sort $order LIMIT $offset, $limit";

$result = $conn->query($sql);
$data = [];

while($row = $result->fetch_assoc()) {
    $data[] = $row;
}

// Ottieni il totale per la paginazione
$totalRes = $conn->query("SELECT COUNT(*) as total FROM esopianeti");
$totalRows = $totalRes->fetch_assoc()['total'];

echo json_encode([
    "rows" => $data,
    "total" => $totalRows
]);
?>