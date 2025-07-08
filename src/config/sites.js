// Configuration for e-commerce sites by country
const sitesByCountry = {
  // United States
  'US': [
    {
      name: 'Amazon US',
      baseUrl: 'https://www.amazon.com',
      searchUrl: 'https://www.amazon.com/s?k={{query}}&ref=nb_sb_noss',
      priority: 10,
      selectors: {
        products: '[data-component-type="s-search-result"]',
        title: 'h2 a span, h2 a',
        price: '.a-price-whole, .a-price .a-offscreen',
        link: 'h2 a',
        image: '.s-image'
      }
    },
    {
      name: 'Best Buy',
      baseUrl: 'https://www.bestbuy.com',
      searchUrl: 'https://www.bestbuy.com/site/searchpage.jsp?st={{query}}',
      priority: 8,
      selectors: {
        products: '.sku-item',
        title: '.sku-header a',
        price: '.pricing-current-price .sr-only',
        link: '.sku-header a',
        image: '.product-image img'
      }
    },
    {
      name: 'Walmart',
      baseUrl: 'https://www.walmart.com',
      searchUrl: 'https://www.walmart.com/search/?query={{query}}',
      priority: 9,
      selectors: {
        products: '[data-automation-id="product-title"]',
        title: '[data-automation-id="product-title"]',
        price: '[itemprop="price"]',
        link: '[data-automation-id="product-title"]',
        image: 'img[data-automation-id="product-image"]'
      }
    },
    {
      name: 'Target',
      baseUrl: 'https://www.target.com',
      searchUrl: 'https://www.target.com/s?searchTerm={{query}}',
      priority: 7,
      selectors: {
        products: '[data-test="product-details"]',
        title: '[data-test="product-title"]',
        price: '[data-test="product-price"]',
        link: '[data-test="product-title"] a',
        image: 'img[alt]'
      }
    }
  ],

  // India
  'IN': [
    {
      name: 'Amazon India',
      baseUrl: 'https://www.amazon.in',
      searchUrl: 'https://www.amazon.in/s?k={{query}}&ref=nb_sb_noss',
      priority: 10,
      selectors: {
        products: '[data-component-type="s-search-result"]',
        title: 'h2 a span, h2 a',
        price: '.a-price-whole, .a-price .a-offscreen',
        link: 'h2 a',
        image: '.s-image'
      }
    },
    {
      name: 'Flipkart',
      baseUrl: 'https://www.flipkart.com',
      searchUrl: 'https://www.flipkart.com/search?q={{query}}',
      priority: 10,
      selectors: {
        products: '._1AtVbE',
        title: '._4rR01T',
        price: '._30jeq3',
        link: '._1fQZEK',
        image: '._396cs4'
      }
    },
    {
      name: 'Myntra',
      baseUrl: 'https://www.myntra.com',
      searchUrl: 'https://www.myntra.com/{{query}}',
      priority: 6,
      categories: ['fashion', 'clothing', 'shoes', 'accessories'],
      selectors: {
        products: '.product-base',
        title: '.product-brand, .product-product',
        price: '.product-discountedPrice',
        link: 'a',
        image: '.product-imageSliderContainer img'
      }
    },
    {
      name: 'Croma',
      baseUrl: 'https://www.croma.com',
      searchUrl: 'https://www.croma.com/search/?text={{query}}',
      priority: 7,
      categories: ['electronics', 'mobile', 'laptop', 'tv'],
      selectors: {
        products: '.product-item',
        title: '.product-title',
        price: '.price',
        link: 'a',
        image: '.product-image img'
      }
    },
    {
      name: 'Sangeetha Mobiles',
      baseUrl: 'https://www.sangeethaaobiles.com',
      searchUrl: 'https://www.sangeethaaobiles.com/search?q={{query}}',
      priority: 8,
      categories: ['mobile', 'phone', 'smartphone'],
      selectors: {
        products: '.product-item-info',
        title: '.product-item-link',
        price: '.price',
        link: '.product-item-link',
        image: '.product-image-photo'
      }
    }
  ],

  // United Kingdom
  'GB': [
    {
      name: 'Amazon UK',
      baseUrl: 'https://www.amazon.co.uk',
      searchUrl: 'https://www.amazon.co.uk/s?k={{query}}&ref=nb_sb_noss',
      priority: 10,
      selectors: {
        products: '[data-component-type="s-search-result"]',
        title: 'h2 a span, h2 a',
        price: '.a-price-whole, .a-price .a-offscreen',
        link: 'h2 a',
        image: '.s-image'
      }
    },
    {
      name: 'Currys',
      baseUrl: 'https://www.currys.co.uk',
      searchUrl: 'https://www.currys.co.uk/search?q={{query}}',
      priority: 8,
      categories: ['electronics', 'mobile', 'laptop', 'tv'],
      selectors: {
        products: '.product-result',
        title: '.product-title',
        price: '.price',
        link: 'a',
        image: '.product-image img'
      }
    },
    {
      name: 'Argos',
      baseUrl: 'https://www.argos.co.uk',
      searchUrl: 'https://www.argos.co.uk/search/{{query}}/',
      priority: 7,
      selectors: {
        products: '.ProductCardstyles__Wrapper',
        title: '.ProductCardstyles__Title',
        price: '.ProductCardstyles__PriceText',
        link: '.ProductCardstyles__Link',
        image: '.ProductCardstyles__Image img'
      }
    }
  ],

  // Germany
  'DE': [
    {
      name: 'Amazon Germany',
      baseUrl: 'https://www.amazon.de',
      searchUrl: 'https://www.amazon.de/s?k={{query}}&ref=nb_sb_noss',
      priority: 10,
      selectors: {
        products: '[data-component-type="s-search-result"]',
        title: 'h2 a span, h2 a',
        price: '.a-price-whole, .a-price .a-offscreen',
        link: 'h2 a',
        image: '.s-image'
      }
    },
    {
      name: 'Otto',
      baseUrl: 'https://www.otto.de',
      searchUrl: 'https://www.otto.de/suche/{{query}}/',
      priority: 8,
      selectors: {
        products: '.productTile',
        title: '.productTile__title',
        price: '.productTile__price',
        link: '.productTile__link',
        image: '.productTile__image img'
      }
    }
  ],

  // Australia
  'AU': [
    {
      name: 'Amazon Australia',
      baseUrl: 'https://www.amazon.com.au',
      searchUrl: 'https://www.amazon.com.au/s?k={{query}}&ref=nb_sb_noss',
      priority: 10,
      selectors: {
        products: '[data-component-type="s-search-result"]',
        title: 'h2 a span, h2 a',
        price: '.a-price-whole, .a-price .a-offscreen',
        link: 'h2 a',
        image: '.s-image'
      }
    },
    {
      name: 'JB Hi-Fi',
      baseUrl: 'https://www.jbhifi.com.au',
      searchUrl: 'https://www.jbhifi.com.au/search?query={{query}}',
      priority: 8,
      categories: ['electronics', 'mobile', 'laptop', 'tv', 'gaming'],
      selectors: {
        products: '.product-item',
        title: '.product-title',
        price: '.price',
        link: 'a',
        image: '.product-image img'
      }
    }
  ],

  // Canada
  'CA': [
    {
      name: 'Amazon Canada',
      baseUrl: 'https://www.amazon.ca',
      searchUrl: 'https://www.amazon.ca/s?k={{query}}&ref=nb_sb_noss',
      priority: 10,
      selectors: {
        products: '[data-component-type="s-search-result"]',
        title: 'h2 a span, h2 a',
        price: '.a-price-whole, .a-price .a-offscreen',
        link: 'h2 a',
        image: '.s-image'
      }
    },
    {
      name: 'Best Buy Canada',
      baseUrl: 'https://www.bestbuy.ca',
      searchUrl: 'https://www.bestbuy.ca/en-ca/search?search={{query}}',
      priority: 8,
      selectors: {
        products: '.product-item',
        title: '.product-title',
        price: '.screenReaderOnly',
        link: '.product-title a',
        image: '.product-image img'
      }
    }
  ]
};

// Currency mapping by country
const currencyByCountry = {
  'US': 'USD',
  'IN': 'INR',
  'GB': 'GBP',
  'DE': 'EUR',
  'AU': 'AUD',
  'CA': 'CAD',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'JP': 'JPY',
  'KR': 'KRW',
  'CN': 'CNY',
  'BR': 'BRL',
  'MX': 'MXN'
};

// Product categories for better site matching
const productCategories = {
  electronics: ['mobile', 'phone', 'laptop', 'computer', 'tv', 'camera', 'headphones', 'speakers'],
  fashion: ['clothing', 'shoes', 'dress', 'shirt', 'pants', 'jacket', 'accessories'],
  home: ['furniture', 'kitchen', 'appliance', 'bedding', 'decor'],
  sports: ['fitness', 'sports', 'outdoor', 'exercise', 'gym'],
  books: ['book', 'novel', 'textbook', 'magazine'],
  automotive: ['car', 'auto', 'motorcycle', 'parts', 'accessories']
};

module.exports = {
  sitesByCountry,
  currencyByCountry,
  productCategories,
  
  // Helper function to get sites for a country
  getSitesForCountry: (countryCode) => {
    return sitesByCountry[countryCode?.toUpperCase()] || [];
  },
  
  // Helper function to get currency for a country
  getCurrencyForCountry: (countryCode) => {
    return currencyByCountry[countryCode?.toUpperCase()] || 'USD';
  },
  
  // Helper function to categorize product
  categorizeProduct: (query) => {
    const queryLower = query.toLowerCase();
    for (const [category, keywords] of Object.entries(productCategories)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return category;
      }
    }
    return 'general';
  }
}; 