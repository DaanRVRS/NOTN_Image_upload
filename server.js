const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');

// --- Configuratie Variabelen ---
const SERVICE_ACCOUNT_KEY_PATH = './nightofthenerds-6db85-firebase-adminsdk-fbsvc-38c0e1f21a.json';
const PROJECT_ID = 'nightofthenerds-6db85';
const BUCKET_NAME = `${PROJECT_ID}.firebasestorage.app`;

// 1. Initialiseer Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require(SERVICE_ACCOUNT_KEY_PATH)),
  projectId: PROJECT_ID,
});

// 2. Pak de bucket
const bucket = admin.storage().bucket(BUCKET_NAME);

const corsOptions = {
  origin: ['http://127.0.0.1:8080', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));

// --- POST route voor upload ---
app.post('/upload', async (req, res) => {
  try {
    const { imageBase64, filename } = req.body;

    if (!imageBase64 || !filename) {
      return res.status(400).json({ error: 'Missing imageBase64 or filename in request body.' });
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    const file = bucket.file(filename);

    // 3. Bestand opslaan
    await file.save(buffer, { contentType: 'image/png' });

    // 4. Het bestand publiek maken → KORTE URLS!
    await file.makePublic();

    // 5. Korte publieke URL (GEEN signed URL!)
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;

    let timestamp = new Date();
    console.log("File uploaded at: " + timestamp.toLocaleTimeString());

    res.json({ url: publicUrl });

  } catch (error) {
    console.error('Upload error details:', error);
    res.status(500).json({ error: 'Failed to upload image.', details: error.message });
  }
});

// Start de server
app.listen(3000, () => console.log('Server running on port 3000'));
