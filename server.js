// Imports
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const listingsRouter = require('./routes/listings');
const cors = require('cors');
dotenv.config();
const app = express();


// Middlewares
app.use(cors()); // Enable CORS for all routes
app.use(express.json());


// Routes
app.use('/listings', listingsRouter);




// Connections
const port = process.env.PORT || 5000;




mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
