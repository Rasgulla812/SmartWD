require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const clothingRoutes = require('./routes/clothingRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/clothing', clothingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => console.log(`Server started on port ${PORT}`));