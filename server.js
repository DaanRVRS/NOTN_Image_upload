const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');

// --- Configuratie Variabelen ---
const SERVICE_ACCOUNT_KEY_PATH = './nightofthenerds-6db85-firebase-adminsdk-fbsvc-3bd40c04a7.json';
const PROJECT_ID = 'nightofthenerds-6db85';
const BUCKET_NAME = `${PROJECT_ID}.firebasestorage.app`;

// 1. Initialiseer Firebase Admin SDK
// We geven de projectId en de credentials expliciet op
admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_KEY_PATH)),
  projectId: PROJECT_ID,
});

// 2. Pak de bucket met de expliciete naam
// Dit is de GCS bucketnaam die Firebase gebruikt
const bucket = admin.storage().bucket(BUCKET_NAME);

const corsOptions = {
    origin: ['http://127.0.0.1:8080', 'http://localhost:8080'], // alle mogelijke frontend URLs
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));

// Zorg dat preflight requests ook goed behandeld worden
app.options('*', cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));

// --- POST route voor upload ---
app.post('/upload', async (req, res) => {
  try {
    const { imageBase64, filename } = req.body;
    
    // Validatie
    if (!imageBase64 || !filename) {
        return res.status(400).json({ error: 'Missing imageBase64 or filename in request body.' });
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const file = bucket.file(filename);

    // 3. Sla het bestand op
    await file.save(buffer, { contentType: 'image/png' });

    // 4. Maak de publiek toegankelijke URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500' 
    });

    console.log(`File uploaded successfully: ${url}`);
    res.json({ url });
  } catch (error) {
    // Deze console.error zal de volledige foutstack in de terminal tonen
    console.error('Upload error details:', error);
    // De response naar de client
    res.status(500).json({ error: 'Failed to upload image.', details: error.message });
  }
});

// Start de server
app.listen(3000, () => console.log('Server running on port 3000'));