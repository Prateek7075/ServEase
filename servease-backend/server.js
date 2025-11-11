const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors'); 

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json({ extended: false }));
app.use(cors()); 

app.get('/', (req, res) => res.send('Servease API Running'));

// Define Routes
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/providers', require('./routes/api/providers'));
app.use('/api/jobs', require('./routes/api/jobs'));
app.use('/api/reviews', require('./routes/api/reviews'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));