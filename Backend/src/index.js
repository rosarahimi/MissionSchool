const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/missionschool';
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

const corsOptions = {
  origin: process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173']
    : ['http://localhost:5173'],
  credentials: true,
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));
// Use crossOriginResourcePolicy({ policy: "cross-origin" }) with Helmet to allow displaying PDFs in iframes/objects
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan('dev'));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user'); // new
const curriculumRoutes = require('./routes/curriculum');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // new
app.use('/api/curriculum', curriculumRoutes);

app.get('/', (req, res) => {
  res.send('Mission School API is running...');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
