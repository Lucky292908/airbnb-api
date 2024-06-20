const mongoose = require('mongoose');
const fs = require('fs');
const Listing = require('./models/Listing');

mongoose.connect('mongodb://localhost/airbnb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', async () => {
    console.log('Connected to Database');
    const data = JSON.parse(fs.readFileSync('path/to/AirBnbListing.json', 'utf8'));

    try {
        await Listing.insertMany(data);
        console.log('Database populated');
        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
});
