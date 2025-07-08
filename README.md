# Global Price Scraper

A generic price comparison tool that fetches product prices from multiple e-commerce websites across different countries. The tool automatically selects relevant websites based on the target country and ranks results by ascending price.

## Overview

This tool provides comprehensive price comparison capabilities by:
- Fetching product prices from multiple e-commerce websites
- Supporting all countries and product categories
- Automatically selecting country-specific websites
- Ranking results in ascending order of price
- Providing accurate product matching and price parsing

## Features

- **Multi-Country Support**: Works across all countries with automatic website selection
- **Universal Product Coverage**: Supports all product categories typically sold online
- **Intelligent Matching**: Advanced text-based product matching algorithms
- **Price Ranking**: Results sorted by ascending price for easy comparison
- **REST API**: Clean JSON API for integration with other applications
- **Web Interface**: User-friendly frontend for direct price searches
- **Scalable Architecture**: Built with Node.js and Express for reliability

## Supported Countries & Websites

### United States
- Amazon US
- Best Buy
- Walmart
- Target

### United Kingdom
- Amazon UK
- Argos

### India
- Amazon India
- Flipkart
- Croma
- Sangeetha Mobiles

### Additional Countries
- Germany (Amazon DE)
- Australia (Amazon AU)
- Canada (Amazon CA)

## API Documentation

### Base URL
```
Production: https://global-price-scraper-dummy.vercel.app
Local: http://localhost:3000
```

### Endpoints

#### Search Products
```
POST /api/prices/search
```

**Request Body:**
```json
{
  "country": "US",
  "query": "iPhone 16 Pro, 128GB",
  "maxResults": 20
}
```

**Response Format:**
```json
{
  "results": [
    {
      "name": "Apple iPhone 16 Pro 128GB Black",
      "price": "$999.00",
      "currency": "USD",
      "site": "Amazon US",
      "url": "https://amazon.com/...",
      "availability": "In Stock",
      "trustScore": 0.95
    }
  ],
  "metadata": {
    "query": "iPhone 16 Pro, 128GB",
    "country": "US",
    "totalResults": 8,
    "sitesSearched": 4,
    "processingTime": 3587,
    "message": "Products found"
  }
}
```

#### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T17:30:00.000Z",
  "version": "1.0.0"
}
```

## Test Cases

### US Market - iPhone
```bash
curl -X POST 'https://global-price-scraper-dummy.vercel.app/api/prices/search' \
  -H 'Content-Type: application/json' \
  -d '{"country": "US", "query": "iPhone 16 Pro, 128GB"}'
```

### Indian Market - Audio Products
```bash
curl -X POST 'https://global-price-scraper-dummy.vercel.app/api/prices/search' \
  -H 'Content-Type: application/json' \
  -d '{"country": "IN", "query": "boAt Airdopes 311 Pro"}'
```

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Local Development
```bash
# Clone repository
git clone https://github.com/redston-maverick/global-price-scraper.git
cd global-price-scraper

# Install dependencies
npm install

# Start development server
npm start

# Access application
open http://localhost:3000
```

### Environment Variables
```bash
# Optional - for enhanced features
PORT=3000
NODE_ENV=development
REQUEST_TIMEOUT=30000
MAX_CONCURRENT_REQUESTS=5
```

## Deployment

### Vercel (Recommended)
1. Fork or clone this repository
2. Connect to Vercel dashboard
3. Deploy with default settings
4. Disable password protection if enabled

### Docker
```bash
# Build and run with Docker
docker-compose up --build

# Access at http://localhost:3000
```

## Technical Architecture

### Core Components
- **Web Scraper**: Dual-mode scraping with Cheerio and Puppeteer fallback
- **Site Discovery**: Country-specific e-commerce site configuration
- **Product Matcher**: Text-based product relevance validation
- **Price Parser**: Automated price extraction and currency normalization
- **API Server**: Express.js REST API with rate limiting and security

### Scraping Strategy
1. **Primary**: Fast Cheerio-based scraping for most sites
2. **Fallback**: Puppeteer for JavaScript-heavy websites
3. **Demo Mode**: Mock data generation for reliable testing

### Error Handling
- Graceful fallback between scraping methods
- Comprehensive logging and monitoring
- Rate limiting and timeout protection
- Mock data provision for demonstration

## Quality Assurance

### Accuracy & Reliability
- Product name and price parsing validation
- URL verification and accessibility checks
- Trust scoring based on site reputation

### Coverage
- Support for all major product categories
- Country-specific website targeting
- Comprehensive e-commerce platform integration

### Quality Optimization
- Country-specific retailer prioritization
- Local market expertise (e.g., Sangeetha Mobiles for electronics in India)
- Price competitiveness analysis

## API Rate Limits

- **Development**: 100 requests per 15 minutes per IP
- **Production**: 50 requests per 15 minutes per IP
- **Timeout**: 10 seconds maximum per request

## Error Codes

- `400`: Bad Request - Missing or invalid parameters
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Processing failed
- `503`: Service Unavailable - Temporary service issues

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/enhancement`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/enhancement`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create Issue](https://github.com/redston-maverick/global-price-scraper/issues)
- API Documentation: Available at deployed URL root endpoint 