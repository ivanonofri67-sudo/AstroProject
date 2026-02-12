<?php
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


$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['name'])) {
    $nome = $data['name'];
    $link = $data['link'];


    // Usiamo una query preparata per sicurezza
    $stmt = $conn->prepare("INSERT INTO fotolink (nome, link) VALUES (?, ?)");
    $stmt->bind_param("ss", $nome, $link); // "ss" = stringa, stringa

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Link foto aggiunto!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Errore nell'inserimento"]);
    }
}
$conn->close();
?>