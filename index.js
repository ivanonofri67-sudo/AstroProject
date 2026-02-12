const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();


// AI
//const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURAZIONE CHIAVI (Inseriscile qui)
//const GEMINI_API_KEY = "AIzaSyATzs4fC6bqh3-kIO6iPxxW0sEVyBDwiuQ";
const IMGBB_API_KEY = "a6a8a17b0d3fd09009bc10930a64b1ae";

//const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);


// 1. Configurazione Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// 2. Endpoint corretto
app.get('/dati', (req, res) => {
  // USA 'pool' invece di 'db'
  pool.query('SELECT * FROM esopianeti', (err, results) => {
    if (err) {
      console.error("Errore query:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});
// Rotta 1: Tutti i dati
app.get('/singnolink', async (req, res) => {
  pool.query('SELECT * FROM esopianeti e LEFT JOIN fotolink p ON e.name = p.nome WHERE p.nome IS NULL ORDER BY e.name ASC LIMIT 1', (err, results) => {

    if (err) {
      console.error("Errore query:", err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});
app.post('/addfotolink', (req, res) => {
  const { name, link } = req.body;

  if (!name || !link) {
        return res.status(400).json({ success: false, message: "Dati mancanti" });
    }
    const sql = "INSERT INTO fotolink (nome, link) VALUES (?, ?)";
// Query preparata (esattamente come in PHP)
    pool.query(sql, [name, link], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Errore database" });
        }
        res.json({ success: true, message: "Link foto aggiunto!" });
    });

  
});

app.post('/generate', async (req, res) => {
    const userPrompt = req.body.prompt;
    const username = req.body.name;
    
    try {

        //const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Generazione Immagine
        //const result = await model.generateContent(userPrompt);
        //const imageBase64 = result.response.candidates[0].content.parts[0].inlineData.data;
        const seed = Math.floor(Math.random() * 100000);
       const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(userPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

   


// --- UTILIZZO DELLA NUOVA FUNZIONE CON RETRY ---
        const imageResponse = await fetchImageWithRetry(imageUrl);


        const base64Image = Buffer.from(imageResponse.data).toString('base64');
        // Caricamento su imgBB

        const params = new URLSearchParams();
        params.append('image', base64Image);
        params.append('name', 'img_' + username);
        const imgBBRes = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, params);

        res.json({ url: imgBBRes.data.data.url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Errore nel processo" });
    }
});

app.listen(3000, () => console.log('Server in ascolto sulla porta 3000'));

// Funzione di supporto per gestire i tentativi (Retry)
async function fetchImageWithRetry(url, retries = 3, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30 secondi di timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            const contentType = response.headers['content-type'];
            if (!contentType.includes('image')) {
                throw new Error("Formato non valido: " + contentType);
            }
            
            return response; // Successo! Ritorna la risposta
        } catch (error) {
            const isLastRetry = i === retries - 1;
            const is502 = error.response && error.response.status === 502;

            if (is502 && !isLastRetry) {
                console.log(`Errore 502 rilevato. Tentativo ${i + 1} fallito. Riprovo tra ${delay/1000}s...`);
                await new Promise(res => setTimeout(res, delay));
                continue; // Passa al prossimo ciclo (tentativo)
            }
            
            throw error; // Se non è un 502 o sono finiti i tentativi, lancia l'errore
        }
    }
}