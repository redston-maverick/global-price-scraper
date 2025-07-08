const logger = require('../utils/logger');

class ProductMatcher {
  constructor() {
    logger.info('Using basic text matching for product relevance (OpenAI removed)');
    this.enabled = false; // OpenAI removed, using basic matching
  }

  // Main method to filter products using basic text matching
  async filterRelevantProducts(products, originalQuery, country) {
    if (!products || products.length === 0) {
      logger.info('No products to filter');
      return products;
    }

    try {
      logger.info(`Using basic text matching to filter ${products.length} products for query: "${originalQuery}"`);
      
      // Use basic text matching as primary method
      const filteredProducts = this.basicTextMatching(products, originalQuery);

      logger.info(`Text filtering complete: ${filteredProducts.length}/${products.length} products matched`);
      return filteredProducts;

    } catch (error) {
      logger.error('Error in product matching:', error.message);
      // Return original products if matching fails
      return products;
    }
  }



  // Basic product relevance scoring based on text similarity
  async scoreProductRelevance(product, originalQuery) {
    try {
      const queryWords = originalQuery.toLowerCase().split(' ').filter(word => word.length > 2);
      const titleWords = product.title.toLowerCase().split(' ');
      
      let matchScore = 0;
      let exactMatches = 0;
      
      for (const queryWord of queryWords) {
        for (const titleWord of titleWords) {
          if (titleWord.includes(queryWord) || queryWord.includes(titleWord)) {
            if (titleWord === queryWord) {
              exactMatches++;
              matchScore += 1.0;
            } else {
              matchScore += 0.5;
            }
            break;
          }
        }
      }
      
      // Calculate score based on match ratio
      const baseScore = Math.min(matchScore / queryWords.length, 1.0);
      
      // Bonus for exact matches
      const exactBonus = (exactMatches / queryWords.length) * 0.2;
      
      const finalScore = Math.min(baseScore + exactBonus, 1.0);
      
      return Math.max(0.1, finalScore); // Minimum score of 0.1
      
    } catch (error) {
      logger.error('Error scoring product relevance:', error.message);
      return 0.5; // Default score if scoring fails
    }
  }

  // Enhance products with computed additional info
  async enhanceProductInfo(products, originalQuery) {
    if (products.length === 0) {
      return products;
    }

    try {
      // Add relevance scores to products
      const enhancedProducts = await Promise.all(
        products.map(async (product) => {
          const relevanceScore = await this.scoreProductRelevance(product, originalQuery);
          return {
            ...product,
            relevanceScore,
            // Add additional computed fields
            pricePerUnit: this.calculatePricePerUnit(product, originalQuery),
            specifications: this.extractSpecifications(product.title)
          };
        })
      );

      return enhancedProducts;

    } catch (error) {
      logger.error('Error enhancing product info:', error.message);
      return products;
    }
  }

  // Extract specifications from product title
  extractSpecifications(title) {
    const specs = {};
    
    // Extract storage capacity
    const storageMatch = title.match(/(\d+)\s*(GB|TB)/i);
    if (storageMatch) {
      specs.storage = storageMatch[0];
    }

    // Extract RAM
    const ramMatch = title.match(/(\d+)\s*GB\s*(RAM|Memory)/i);
    if (ramMatch) {
      specs.ram = ramMatch[0];
    }

    // Extract screen size
    const screenMatch = title.match(/(\d+\.?\d*)["\s]*(inch|Inch)/i);
    if (screenMatch) {
      specs.screenSize = screenMatch[0];
    }

    // Extract color
    const colorMatch = title.match(/\b(Black|White|Red|Blue|Green|Gold|Silver|Rose|Gray|Grey|Pink|Purple|Yellow|Orange)\b/i);
    if (colorMatch) {
      specs.color = colorMatch[0];
    }

    return specs;
  }

  // Calculate price per unit for comparison
  calculatePricePerUnit(product, query) {
    // This is a simplified implementation
    // In a real scenario, you'd want more sophisticated unit detection
    const title = product.title.toLowerCase();
    const price = product.price;

    // For storage devices, calculate price per GB
    if (title.includes('gb') || title.includes('tb')) {
      const storageMatch = title.match(/(\d+)\s*(gb|tb)/i);
      if (storageMatch) {
        const storage = parseInt(storageMatch[1]);
        const multiplier = storageMatch[2].toLowerCase() === 'tb' ? 1024 : 1;
        const storageInGB = storage * multiplier;
        return (price / storageInGB).toFixed(2);
      }
    }

    return null;
  }

  // Primary method for text-based product matching
  basicTextMatching(products, originalQuery) {
    const queryWords = originalQuery.toLowerCase().split(' ').filter(word => word.length > 2);
    
    return products.filter(product => {
      const titleWords = product.title.toLowerCase().split(' ');
      let matchCount = 0;
      let exactMatches = 0;
      
      for (const queryWord of queryWords) {
        for (const titleWord of titleWords) {
          if (titleWord.includes(queryWord) || queryWord.includes(titleWord)) {
            matchCount++;
            if (titleWord === queryWord) {
              exactMatches++;
            }
            break;
          }
        }
      }
      
      const matchRatio = matchCount / queryWords.length;
      const exactRatio = exactMatches / queryWords.length;
      
      // More flexible matching: 40% match ratio OR 20% exact matches
      return matchRatio >= 0.4 || exactRatio >= 0.2;
    });
  }
}

module.exports = ProductMatcher; 