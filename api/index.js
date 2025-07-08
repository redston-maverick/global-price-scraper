const express = require('express');
const cors = require('cors');

// Simple mock data for testing
const mockProducts = {
  'US': [
    { name: 'iPhone 16 Pro 128GB Black', price: '$999.00', currency: 'USD', site: 'Amazon US', url: 'https://amazon.com/iphone', availability: 'In Stock', trustScore: 0.95 },
    { name: 'iPhone 16 Pro 128GB White', price: '$1099.00', currency: 'USD', site: 'Best Buy', url: 'https://bestbuy.com/iphone', availability: 'In Stock', trustScore: 0.90 },
    { name: 'iPhone 16 Pro 128GB Blue', price: '$1199.00', currency: 'USD', site: 'Target', url: 'https://target.com/iphone', availability: 'Limited Stock', trustScore: 0.88 }
  ],
  'GB': [
    { name: 'Samsung Galaxy S24 128GB Black', price: '£799.00', currency: 'GBP', site: 'Amazon UK', url: 'https://amazon.co.uk/galaxy', availability: 'In Stock', trustScore: 0.92 },
    { name: 'Samsung Galaxy S24 256GB White', price: '£899.00', currency: 'GBP', site: 'Argos', url: 'https://argos.co.uk/galaxy', availability: 'In Stock', trustScore: 0.85 }
  ],
  'IN': [
    { name: 'boAt Airdopes 311 Pro Black', price: '₹2999', currency: 'INR', site: 'Amazon India', url: 'https://amazon.in/boat', availability: 'In Stock', trustScore: 0.87 },
    { name: 'boAt Airdopes 311 Pro White', price: '₹3299', currency: 'INR', site: 'Flipkart', url: 'https://flipkart.com/boat', availability: 'In Stock', trustScore: 0.82 }
  ]
};

// Create Express app
const app = express();

// CORS - allow all origins for public API
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'Global Price Scraper API is running'
  });
});

// Price search endpoint with mock data
app.post('/api/prices/search', (req, res) => {
  try {
    const { country, query, maxResults = 10 } = req.body;
    
    if (!country || !query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both country and query are required'
      });
    }

    // Get mock products for the country
    const countryProducts = mockProducts[country.toUpperCase()] || [];
    
    // Filter products based on query (simple text matching)
    const filteredProducts = countryProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().split(' ').some(word => 
        product.name.toLowerCase().includes(word.toLowerCase())
      )
    ).slice(0, parseInt(maxResults));

    // If no specific matches, return all products for the country
    const results = filteredProducts.length > 0 ? filteredProducts : countryProducts.slice(0, parseInt(maxResults));

    res.json({
      results: results,
      metadata: {
        query: query,
        country: country,
        totalResults: results.length,
        sitesSearched: results.length > 0 ? 2 : 0,
        processingTime: Math.floor(Math.random() * 3000) + 1000, // Mock processing time
        message: results.length > 0 ? 'Products found' : 'No products found for this query',
        demoMode: true
      }
    });
  } catch (error) {
    console.error('Error in price search:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process price search request'
    });
  }
});

// Root route - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Global Price Scraper API',
    version: '1.0.0',
    description: 'Compare product prices across multiple countries and e-commerce sites',
    endpoints: {
      health: 'GET /api/health',
      search: 'POST /api/prices/search'
    },
    demoMode: true,
    supportedCountries: ['US', 'GB', 'IN'],
    exampleRequest: {
      url: '/api/prices/search',
      method: 'POST',
      body: {
        country: 'US',
        query: 'iPhone 16 Pro',
        maxResults: 10
      }
    }
  });
});

// 404 handler for all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: [
      'GET /',
      'POST /api/prices/search',
      'GET /api/health'
    ]
  });
});

// Export the app for Vercel
module.exports = app; 