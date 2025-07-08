const logger = require('../utils/logger');
const { getCurrencyForCountry } = require('../config/sites');

class PriceService {
  constructor() {
    // Exchange rates (in a real application, you'd fetch these from an API)
    this.exchangeRates = {
      'USD': 1.0,      // Base currency
      'INR': 83.25,
      'GBP': 0.79,
      'EUR': 0.92,
      'AUD': 1.52,
      'CAD': 1.35,
      'JPY': 149.50,
      'KRW': 1320.0,
      'CNY': 7.25,
      'BRL': 5.12,
      'MXN': 17.85
    };
  }

  // Main method to process and rank products by price
  async processAndRankProducts(products, targetCountry) {
    try {
      logger.info(`Processing ${products.length} products for ranking`);
      
      // Parse and normalize prices
      const processedProducts = products.map(product => {
        const normalizedProduct = this.normalizeProduct(product, targetCountry);
        return normalizedProduct;
      }).filter(product => product.normalizedPrice > 0); // Remove products with invalid prices

      // Sort by normalized price (ascending)
      const rankedProducts = processedProducts.sort((a, b) => a.normalizedPrice - b.normalizedPrice);

      // Add ranking information
      const rankedWithPosition = rankedProducts.map((product, index) => ({
        ...product,
        rank: index + 1,
        priceRank: this.calculatePriceRank(product.normalizedPrice, rankedProducts),
        savings: this.calculateSavings(product.normalizedPrice, rankedProducts)
      }));

      logger.info(`Successfully ranked ${rankedWithPosition.length} products`);
      return rankedWithPosition;

    } catch (error) {
      logger.error('Error processing and ranking products:', error.message);
      return products;
    }
  }

  // Normalize product data for consistent comparison
  normalizeProduct(product, targetCountry) {
    const targetCurrency = getCurrencyForCountry(targetCountry);
    
    return {
      link: product.link,
      price: this.formatPrice(product.price, product.currency),
      currency: targetCurrency,
      productName: this.cleanProductName(product.title),
      source: product.source,
      image: product.image,
      originalPrice: product.price,
      originalCurrency: product.currency,
      normalizedPrice: this.convertToTargetCurrency(product.price, product.currency, targetCurrency),
      specifications: product.specifications || {},
      relevanceScore: product.relevanceScore || 0.5,
      // Additional fields for better comparison
      pricePerUnit: product.pricePerUnit,
      availability: this.checkAvailability(product),
      trustScore: this.calculateTrustScore(product.source),
      lastUpdated: new Date().toISOString()
    };
  }

  // Convert price to target currency
  convertToTargetCurrency(price, fromCurrency, toCurrency) {
    if (!price || !fromCurrency || !toCurrency) {
      return 0;
    }

    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    if (fromCurrency === toCurrency) {
      return price;
    }

    const fromRate = this.exchangeRates[fromCurrency];
    const toRate = this.exchangeRates[toCurrency];

    if (!fromRate || !toRate) {
      logger.warn(`Exchange rate not found for ${fromCurrency} or ${toCurrency}`);
      return price; // Return original price if conversion not possible
    }

    // Convert to USD first, then to target currency
    const usdPrice = price / fromRate;
    const targetPrice = usdPrice * toRate;

    return Math.round(targetPrice * 100) / 100; // Round to 2 decimal places
  }

  // Format price for display
  formatPrice(price, currency) {
    if (!price || !currency) return 'N/A';

    const currencySymbols = {
      'USD': '$',
      'INR': '₹',
      'GBP': '£',
      'EUR': '€',
      'AUD': 'A$',
      'CAD': 'C$',
      'JPY': '¥',
      'KRW': '₩',
      'CNY': '¥',
      'BRL': 'R$',
      'MXN': '$'
    };

    const symbol = currencySymbols[currency.toUpperCase()] || currency;
    
    // Format number with appropriate decimal places
    let formattedPrice;
    if (currency === 'JPY' || currency === 'KRW') {
      formattedPrice = Math.round(price).toLocaleString();
    } else {
      formattedPrice = price.toFixed(2);
    }

    return `${symbol}${formattedPrice}`;
  }

  // Clean product name for better display
  cleanProductName(title) {
    if (!title) return 'Unknown Product';

    return title
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/[^\w\s\-.,()]/g, '') // Remove special characters except basic ones
      .trim()
      .substring(0, 100); // Limit length
  }

  // Calculate price rank (percentile)
  calculatePriceRank(price, allProducts) {
    const prices = allProducts.map(p => p.normalizedPrice).sort((a, b) => a - b);
    const position = prices.findIndex(p => p >= price);
    return Math.round((position / prices.length) * 100);
  }

  // Calculate savings compared to highest price
  calculateSavings(price, allProducts) {
    const prices = allProducts.map(p => p.normalizedPrice);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    
    if (maxPrice === minPrice) return 0;
    
    const savingsAmount = maxPrice - price;
    const savingsPercentage = (savingsAmount / maxPrice) * 100;
    
    return {
      amount: Math.round(savingsAmount * 100) / 100,
      percentage: Math.round(savingsPercentage * 100) / 100
    };
  }

  // Check product availability (basic implementation)
  checkAvailability(product) {
    // In a real implementation, you might check stock status from the scraped data
    // For now, we'll assume products are available if they have a valid price
    return product.price > 0 ? 'In Stock' : 'Out of Stock';
  }

  // Calculate trust score for a source
  calculateTrustScore(source) {
    const trustScores = {
      'Amazon US': 0.95,
      'Amazon India': 0.95,
      'Amazon UK': 0.95,
      'Amazon Germany': 0.95,
      'Amazon Australia': 0.95,
      'Amazon Canada': 0.95,
      'Best Buy': 0.90,
      'Best Buy Canada': 0.90,
      'Walmart': 0.85,
      'Target': 0.85,
      'Flipkart': 0.88,
      'Myntra': 0.82,
      'Croma': 0.80,
      'Sangeetha Mobiles': 0.75,
      'Currys': 0.80,
      'Argos': 0.78,
      'Otto': 0.75,
      'JB Hi-Fi': 0.80
    };

    return trustScores[source] || 0.70; // Default trust score
  }

  // Advanced filtering based on price criteria
  filterByPriceRange(products, minPrice, maxPrice, currency) {
    if (!minPrice && !maxPrice) return products;

    return products.filter(product => {
      const price = product.normalizedPrice;
      
      let passesMin = true;
      let passesMax = true;
      
      if (minPrice) {
        const normalizedMin = this.convertToTargetCurrency(minPrice, currency, product.currency);
        passesMin = price >= normalizedMin;
      }
      
      if (maxPrice) {
        const normalizedMax = this.convertToTargetCurrency(maxPrice, currency, product.currency);
        passesMax = price <= normalizedMax;
      }
      
      return passesMin && passesMax;
    });
  }

  // Get price statistics for the product set
  getPriceStatistics(products) {
    if (!products || products.length === 0) {
      return null;
    }

    const prices = products.map(p => p.normalizedPrice).filter(p => p > 0);
    
    if (prices.length === 0) {
      return null;
    }

    prices.sort((a, b) => a - b);
    
    const min = prices[0];
    const max = prices[prices.length - 1];
    const median = prices[Math.floor(prices.length / 2)];
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return {
      min,
      max,
      median: Math.round(median * 100) / 100,
      average: Math.round(average * 100) / 100,
      count: prices.length,
      range: max - min,
      currency: products[0]?.currency || 'USD'
    };
  }

  // Format final output according to the specified structure
  formatOutput(products) {
    return products.map(product => ({
      link: product.link,
      price: product.price,
      currency: product.currency,
      productName: product.productName,
      source: product.source,
      image: product.image,
      rank: product.rank,
      specifications: product.specifications,
      relevanceScore: product.relevanceScore,
      priceRank: product.priceRank,
      savings: product.savings,
      availability: product.availability,
      trustScore: product.trustScore,
      lastUpdated: product.lastUpdated
    }));
  }

  // Update exchange rates (should be called periodically in production)
  async updateExchangeRates() {
    try {
      // In a real implementation, you would fetch from a currency API
      // For example: https://api.exchangerate-api.com/v4/latest/USD
      logger.info('Exchange rates update would happen here in production');
    } catch (error) {
      logger.error('Error updating exchange rates:', error.message);
    }
  }
}

module.exports = PriceService; 