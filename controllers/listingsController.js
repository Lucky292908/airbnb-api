// controllers/listingsController.js
const Listing = require('../models/Listing');

// Get all listings with pagination and filtering
exports.getListings = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;

    const listings = await Listing.find(filters)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Listing.countDocuments(filters);

    res.json({
      listings,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new listing
exports.createListing = async (req, res) => {
  try {
    const listing = new Listing(req.body);
    await listing.save();
    res.status(201).json(listing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get a single listing by ID
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
