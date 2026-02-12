<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
// Permette al tuo HTML di leggere i dati (sostituisce CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Credenziali (le trovi nel pannello di InfinityFree sotto "MySQL Details")
$host = "sql211.infinityfree.com"; // Esempio
$user = "if0_40798161";
$pass = "9801Nata";
$dbname = "if0_40798161_astroproject";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connessione fallita"]));
}


$filtro = isset($_GET['filtro']) ? $_GET['filtro'] : '';

if ($filtro === 'singnolink') {
    // Query per una riga specifica (usiamo i parametri per sicurezza)
    $sql = "SELECT * 
            FROM esopianeti e 
            LEFT JOIN fotolink p ON e.name = p.nome 
            WHERE p.nome IS NULL 
            ORDER BY e.name ASC 
            LIMIT 1";

} else 
{

    // Se non c'è nome, restituisce i primi 50 come prima
    $sql = "SELECT * 
            FROM esopianeti 
            ORDER BY name ASC 
            LIMIT 50";
}
$result = $conn->query($sql);
$res_array = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $res_array[] = $row;
    }
}
ob_clean();
// Invia i dati in formato JSON (proprio come faceva Node)
echo json_encode($res_array);

$conn->close();
?>