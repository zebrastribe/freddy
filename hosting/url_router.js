/**
 * URLRouter - Handles URL routing abstraction
 * 
 * @class URLRouter
 * @description Manages URL routing independent of hosting provider
 */

export class URLRouter {
  constructor(hostingAbstraction) {
    this.hostingAbstraction = hostingAbstraction;
  }

  /**
   * Get pet URL based on current hosting provider
   */
  getPetUrl(petName) {
    return this.hostingAbstraction.getPetUrl(petName);
  }

  /**
   * Get admin URL
   */
  getAdminUrl() {
    const provider = this.hostingAbstraction.getCurrentProvider();
    return `${provider.baseUrl}/admin/`;
  }

  /**
   * Parse URL to extract pet name
   */
  parsePetFromUrl(url) {
    // Extract pet name from URL path
    const pathMatch = url.match(/\/([^\/]+)\/?$/);
    return pathMatch ? pathMatch[1] : null;
  }

  /**
   * Check if URL is for admin interface
   */
  isAdminUrl(url) {
    return url.includes('/admin/');
  }

  /**
   * Generate redirect URL for pet domain
   */
  generateRedirectUrl(petName) {
    return this.getPetUrl(petName);
  }

  /**
   * Get canonical URL for a pet
   */
  getCanonicalUrl(petName) {
    return this.getPetUrl(petName);
  }

  /**
   * Generate sitemap URLs for all pets
   */
  async generateSitemapUrls() {
    // This would typically fetch all pets from the database
    // For now, we'll return a mock structure
    const pets = [
      { name: 'freddy', domain: 'freddy.stri.be' },
      { name: 'anna', domain: 'anna.stri.be' }
    ];

    return pets.map(pet => ({
      url: this.getPetUrl(pet.name),
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.8
    }));
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt() {
    const baseUrl = this.hostingAbstraction.getCurrentProvider().baseUrl;
    
    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Admin area
Disallow: /admin/

# API endpoints
Disallow: /api/`;
  }

  /**
   * Generate sitemap XML
   */
  async generateSitemapXml() {
    const urls = await this.generateSitemapUrls();
    const baseUrl = this.hostingAbstraction.getCurrentProvider().baseUrl;
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Add main page
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/</loc>\n`;
    sitemap += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    sitemap += `    <changefreq>daily</changefreq>\n`;
    sitemap += `    <priority>1.0</priority>\n`;
    sitemap += `  </url>\n`;
    
    // Add pet URLs
    urls.forEach(url => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${url.url}</loc>\n`;
      sitemap += `    <lastmod>${url.lastmod}</lastmod>\n`;
      sitemap += `    <changefreq>${url.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${url.priority}</priority>\n`;
      sitemap += `  </url>\n`;
    });
    
    sitemap += '</urlset>';
    
    return sitemap;
  }

  /**
   * Validate URL format
   */
  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Normalize URL
   */
  normalizeUrl(url) {
    // Remove trailing slash
    return url.replace(/\/$/, '');
  }

  /**
   * Get URL parameters
   */
  getUrlParameters(url) {
    const urlObj = new URL(url);
    const params = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }

  /**
   * Build URL with parameters
   */
  buildUrl(baseUrl, parameters = {}) {
    const url = new URL(baseUrl);
    
    Object.entries(parameters).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  }

  /**
   * Check if URL is internal
   */
  isInternalUrl(url) {
    const baseUrl = this.hostingAbstraction.getCurrentProvider().baseUrl;
    return url.startsWith(baseUrl);
  }

  /**
   * Get relative path from URL
   */
  getRelativePath(url) {
    const baseUrl = this.hostingAbstraction.getCurrentProvider().baseUrl;
    return url.replace(baseUrl, '');
  }

  /**
   * Generate meta tags for a pet
   */
  generateMetaTags(petName, petConfig) {
    const petUrl = this.getPetUrl(petName);
    
    return {
      title: `${petConfig.name} - Pet Tracker`,
      description: petConfig.metadata?.description || `Track ${petConfig.name}'s location and status`,
      url: petUrl,
      image: petConfig.metadata?.photoUrl || `${petUrl}img/default-pet.jpg`,
      type: 'website',
      canonical: petUrl
    };
  }

  /**
   * Generate Open Graph tags
   */
  generateOpenGraphTags(petName, petConfig) {
    const metaTags = this.generateMetaTags(petName, petConfig);
    
    return {
      'og:title': metaTags.title,
      'og:description': metaTags.description,
      'og:url': metaTags.url,
      'og:image': metaTags.image,
      'og:type': metaTags.type,
      'og:site_name': 'Pet Tracker'
    };
  }

  /**
   * Generate Twitter Card tags
   */
  generateTwitterCardTags(petName, petConfig) {
    const metaTags = this.generateMetaTags(petName, petConfig);
    
    return {
      'twitter:card': 'summary_large_image',
      'twitter:title': metaTags.title,
      'twitter:description': metaTags.description,
      'twitter:image': metaTags.image,
      'twitter:url': metaTags.url
    };
  }

  /**
   * Generate structured data for a pet
   */
  generateStructuredData(petName, petConfig) {
    const petUrl = this.getPetUrl(petName);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${petConfig.name} - Pet Tracker`,
      description: petConfig.metadata?.description || `Track ${petConfig.name}'s location and status`,
      url: petUrl,
      mainEntity: {
        '@type': 'Pet',
        name: petConfig.name,
        breed: petConfig.breed,
        description: petConfig.metadata?.description,
        image: petConfig.metadata?.photoUrl
      }
    };
  }

  /**
   * Handle URL routing for different hosting providers
   */
  handleRouting(url, hostingProvider) {
    const provider = this.hostingAbstraction.providers[hostingProvider];
    
    if (!provider) {
      throw new Error(`Unknown hosting provider: ${hostingProvider}`);
    }

    // Extract pet name from URL
    const petName = this.parsePetFromUrl(url);
    
    if (!petName) {
      return {
        type: 'main',
        url: provider.baseUrl,
        redirect: false
      };
    }

    // Check if it's an admin URL
    if (this.isAdminUrl(url)) {
      return {
        type: 'admin',
        url: this.getAdminUrl(),
        redirect: false
      };
    }

    // Check if it's a pet URL
    return {
      type: 'pet',
      petName: petName,
      url: this.getPetUrl(petName),
      redirect: url !== this.getPetUrl(petName)
    };
  }

  /**
   * Generate URL patterns for different hosting providers
   */
  generateUrlPatterns(hostingProvider) {
    const provider = this.hostingAbstraction.providers[hostingProvider];
    
    if (!provider) {
      throw new Error(`Unknown hosting provider: ${hostingProvider}`);
    }

    return {
      main: provider.baseUrl,
      pet: `${provider.baseUrl}/{petName}/`,
      admin: `${provider.baseUrl}/admin/`,
      api: `${provider.baseUrl}/api/`
    };
  }

  /**
   * Check if URL matches a pattern
   */
  matchesPattern(url, pattern) {
    const regex = new RegExp(pattern.replace(/\{(\w+)\}/g, '([^/]+)'));
    return regex.test(url);
  }

  /**
   * Extract parameters from URL using pattern
   */
  extractParameters(url, pattern) {
    const regex = new RegExp(pattern.replace(/\{(\w+)\}/g, '([^/]+)'));
    const match = url.match(regex);
    
    if (!match) {
      return null;
    }

    const params = {};
    const paramNames = pattern.match(/\{(\w+)\}/g)?.map(p => p.slice(1, -1)) || [];
    
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });
    
    return params;
  }
}

export default URLRouter; 