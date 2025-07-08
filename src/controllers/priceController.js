const express = require('express');
const router = express.Router();
const WebScraper = require('../services/scraper');
const ProductMatcher = require('../services/aiMatcher');
const PriceService = require('../services/priceService');
const { getSitesForCountry, categorizeProduct } = require('../config/sites');
const logger = require('../utils/logger');

// Initialize services
const scraper = new WebScraper();
const productMatcher = new ProductMatcher();
const priceService = new PriceService();

// Main endpoint to search for product prices
router.post('/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { country, query, minPrice, maxPrice, maxResults = 20 } = req.body;

    // Validate input
    if (!country || !query) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['country', 'query'],
        received: { country: !!country, query: !!query }
      });
    }

    logger.info(`Price search request: ${query} in ${country}`);

    // Get relevant sites for the country
    const sites = getSitesForCountry(country);
    if (sites.length === 0) {
      return res.status(400).json({
        error: 'Country not supported',
        supportedCountries: ['US', 'IN', 'GB', 'DE', 'AU', 'CA'],
        received: country
      });
    }

    // Categorize the product to filter relevant sites
    const productCategory = categorizeProduct(query);
    const relevantSites = sites.filter(site => {
      if (!site.categories) return true; // Include sites without category restrictions
      return site.categories.includes(productCategory);
    });

    // If no category-specific sites found, use all sites
    const sitesToScrape = relevantSites.length > 0 ? relevantSites : sites;
    
    logger.info(`Scraping ${sitesToScrape.length} sites for product category: ${productCategory}`);

    // Scrape products from all relevant sites in parallel
    const scrapingPromises = sitesToScrape.map(site => 
      scraper.scrapeSite(site, query).catch(error => {
        logger.warn(`Failed to scrape ${site.name}:`, error.message);
        return []; // Return empty array on failure
      })
    );

    const scrapingResults = await Promise.all(scrapingPromises);
    const allProducts = scrapingResults.flat();

    logger.info(`Found ${allProducts.length} total products from ${sitesToScrape.length} sites`);

    if (allProducts.length === 0) {
      return res.json({
        results: [],
        metadata: {
          query,
          country,
          totalResults: 0,
          sitesSearched: sitesToScrape.length,
          processingTime: Date.now() - startTime,
          message: 'No products found for this query'
        }
      });
    }

    // Use text matching to filter relevant products
    const relevantProducts = await productMatcher.filterRelevantProducts(allProducts, query, country);

    // Process and rank products by price
    const rankedProducts = await priceService.processAndRankProducts(relevantProducts, country);

    // Apply price filtering if specified
    let filteredProducts = rankedProducts;
    if (minPrice || maxPrice) {
      const targetCurrency = priceService.getCurrencyForCountry?.(country) || 'USD';
      filteredProducts = priceService.filterByPriceRange(rankedProducts, minPrice, maxPrice, targetCurrency);
    }

    // Limit results
    const finalProducts = filteredProducts.slice(0, maxResults);

    // Format output according to specification
    const formattedResults = priceService.formatOutput(finalProducts);

    // Get price statistics
    const priceStats = priceService.getPriceStatistics(finalProducts);

    // Prepare response
    const response = {
      results: formattedResults,
      metadata: {
        query,
        country,
        totalResults: formattedResults.length,
        totalFound: allProducts.length,
        sitesSearched: sitesToScrape.length,
        sitesUsed: sitesToScrape.map(site => site.name),
        processingTime: Date.now() - startTime,
        priceStatistics: priceStats,
        filters: {
          minPrice,
          maxPrice,
          maxResults,
          category: productCategory
        },
        lastUpdated: new Date().toISOString()
      }
    };

    logger.info(`Price search completed: ${formattedResults.length} results in ${Date.now() - startTime}ms`);
    res.json(response);

  } catch (error) {
    logger.error('Error in price search:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      processingTime: Date.now() - startTime
    });
  }
});

// Endpoint to get supported countries and sites
router.get('/supported', (req, res) => {
  try {
    const { getSitesForCountry } = require('../config/sites');
    
    const supportedCountries = ['US', 'IN', 'GB', 'DE', 'AU', 'CA'];
    const countriesInfo = supportedCountries.map(country => ({
      country,
      currency: require('../config/sites').getCurrencyForCountry(country),
      sites: getSitesForCountry(country).map(site => ({
        name: site.name,
        priority: site.priority,
        categories: site.categories || ['all']
      }))
    }));

    res.json({
      supportedCountries: countriesInfo,
      totalSites: supportedCountries.reduce((total, country) => 
        total + getSitesForCountry(country).length, 0
      )
    });

  } catch (error) {
    logger.error('Error getting supported countries:', error.message);
    res.status(500).json({ error: 'Failed to get supported countries' });
  }
});

// Endpoint to test a specific site
router.post('/test-site', async (req, res) => {
  try {
    const { siteName, query, country } = req.body;

    if (!siteName || !query) {
      return res.status(400).json({
        error: 'Missing required fields: siteName, query'
      });
    }

    const sites = getSitesForCountry(country || 'US');
    const targetSite = sites.find(site => site.name.toLowerCase().includes(siteName.toLowerCase()));

    if (!targetSite) {
      return res.status(404).json({
        error: 'Site not found',
        availableSites: sites.map(site => site.name)
      });
    }

    logger.info(`Testing site: ${targetSite.name} with query: ${query}`);

    const products = await scraper.scrapeSite(targetSite, query);
    
    res.json({
      site: targetSite.name,
      query,
      results: products,
      count: products.length,
      testTime: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error testing site:', error.message);
    res.status(500).json({
      error: 'Site test failed',
      message: error.message
    });
  }
});

// Endpoint to get price statistics for a query across countries
router.post('/compare-countries', async (req, res) => {
  try {
    const { query, countries = ['US', 'IN', 'GB'] } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    logger.info(`Comparing prices for "${query}" across countries: ${countries.join(', ')}`);

    const countryPromises = countries.map(async (country) => {
      try {
        const sites = getSitesForCountry(country).slice(0, 2); // Limit to 2 sites per country for speed
        const scrapingPromises = sites.map(site => scraper.scrapeSite(site, query));
        const results = await Promise.all(scrapingPromises);
        const products = results.flat();
        
        const relevantProducts = await productMatcher.filterRelevantProducts(products, query, country);
        const rankedProducts = await priceService.processAndRankProducts(relevantProducts, country);
        
        return {
          country,
          currency: require('../config/sites').getCurrencyForCountry(country),
          products: rankedProducts.slice(0, 3), // Top 3 products
          statistics: priceService.getPriceStatistics(rankedProducts)
        };
      } catch (error) {
        logger.warn(`Error comparing prices for ${country}:`, error.message);
        return {
          country,
          error: error.message,
          products: [],
          statistics: null
        };
      }
    });

    const countryResults = await Promise.all(countryPromises);

    res.json({
      query,
      countries: countryResults,
      comparisonTime: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in country comparison:', error.message);
    res.status(500).json({ error: 'Country comparison failed' });
  }
});

// Cleanup endpoint (for graceful shutdown)
router.post('/cleanup', async (req, res) => {
  try {
    await scraper.closeBrowser();
    res.json({ message: 'Cleanup completed' });
  } catch (error) {
    logger.error('Error during cleanup:', error.message);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, performing graceful shutdown...');
  try {
    await scraper.closeBrowser();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, performing graceful shutdown...');
  try {
    await scraper.closeBrowser();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error.message);
    process.exit(1);
  }
});

module.exports = router; 