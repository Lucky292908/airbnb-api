const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');

// Helper function to build filters
const buildFilters = (query) => {
    let filters = {};
    if (query.neighbourhood) filters.neighbourhood = query.neighbourhood;
    if (query.price_min) filters.price = { $gte: parseFloat(query.price_min) };
    if (query.price_max) {
        filters.price = filters.price || {};
        filters.price.$lte = parseFloat(query.price_max);
    }
    if (query.room_type) filters.room_type = query.room_type;
    if (query.accommodates) filters.accommodates = parseInt(query.accommodates, 10);
    return filters;
};

// GET /listings - Get Listings with Pagination and Filters
router.get('/', async (req, res) => {
    const { page = 1, limit = 100 } = req.query;

    try {
        const filters = buildFilters(req.query);
        const listings = await Listing.find(filters)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .exec();
        const count = await Listing.countDocuments(filters);
        res.json({
            listings,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /listings/hosts/:host_id/listings - Get Listings by Host ID
router.get('/hosts/:host_id/listings', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { host_id } = req.params;

    try {
        const listings = await Listing.find({ host_id })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .exec();
        const count = await Listing.countDocuments({ host_id });
        res.json({
            listings,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /listings/search - Search Listings by Keywords
router.get('/search', async (req, res) => {
    const { q, page = 1, limit = 100 } = req.query;
    const query = q ? { $text: { $search: q } } : {};

    try {
        const listings = await Listing.find(query)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .exec();
        const count = await Listing.countDocuments(query);
        res.json({
            listings,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// GET /listings/price - Get Listings by Price Range
router.get('/price', async (req, res) => {
    const { price_min, price_max, page = 1, limit = 100 } = req.query;
    const filters = {};

    console.log('Received query params:', req.query);

    // Parse and validate price range inputs
    if (price_min || price_max) {
        filters.price = {};
        if (price_min) {
            const minPrice = parseFloat(price_min.trim());
            if (!isNaN(minPrice)) {
                filters.price.$gte = minPrice;
                console.log('Minimum price set to:', minPrice);
            } else {
                console.log('Invalid minimum price:', price_min);
            }
        }
        if (price_max) {
            const maxPrice = parseFloat(price_max.trim());
            if (!isNaN(maxPrice)) {
                filters.price.$lte = maxPrice;
                console.log('Maximum price set to:', maxPrice);
            } else {
                console.log('Invalid maximum price:', price_max);
            }
        }
    }

    console.log('Filters applied:', filters);

    try {
        const listings = await Listing.find(filters)
        .sort({price:1})
            .limit(parseInt(limit))
            
            .skip((parseInt(page) - 1) * parseInt(limit))
            .exec()
            
            ;

        const count = await Listing.countDocuments(filters);

        console.log(`Found ${listings.length} listings, total count: ${count}`);

        res.json({
            listings,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        console.error('Error fetching listings:', err.message);
        res.status(500).json({ message: err.message });
    }
});
// GET /listings/amenities - Get Listings with Specific Amenities
router.get('/amenities', async (req, res) => {
    const { amenities, page = 1, limit = 100 } = req.query;

    // Split the comma-separated string of amenities into an array
    const amenitiesArray = amenities.split(',');

    // Setup filters to find listings with all specified amenities
    const filters = {
        amenities: { $all: amenitiesArray }
    };

    try {
        // Query listings based on filters, limit, and pagination
        const listings = await Listing.find(filters)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .exec();
 
        // Count total documents matching the filters
        const count = await Listing.countDocuments(filters);

        // Return response with listings, pagination details
        res.json({
            listings,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        // Handle errors
        res.status(500).json({ message: err.message });
    }
});

// GET /listings/:id - Get a Single Listing by ID
router.get('/:id', getListing, (req, res) => {
    res.json(res.listing);
});

// POST /listings - Create a New Listing
router.post('/', async (req, res) => {
    const listing = new Listing(req.body);

    try {
        const newListing = await listing.save();
        res.status(201).json(newListing);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a listing
router.put('/:id', getListing, async (req, res) => {
    if (req.body._id) {
        delete req.body._id;
    }
    Object.assign(res.listing, req.body);
    try {
        const updatedListing = await res.listing.save();
        res.json(updatedListing);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// DELETE /listings/:id - Delete a Listing
router.delete('/:id', getListing, async (req, res) => {
    try {
        await Listing.deleteOne({ _id: req.params.id });
        res.json({ message: 'Deleted Listing' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Middleware to get listing by ID
async function getListing(req, res, next) {
    let listing;
    try {
        listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: 'Cannot find listing' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.listing = listing;
    next();
}

module.exports = router;
