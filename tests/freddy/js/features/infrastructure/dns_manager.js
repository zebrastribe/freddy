/**
 * DNS Manager for Simply.com DDNS API Integration
 *
 * @class DNSManager
 * @description Manages subdomain creation/updates for pets using Simply.com DDNS endpoint
 */

export class DNSManager {
  /**
   * @param {string} apiKey - Simply.com API key
   * @param {string} accountNo - Simply.com account number (e.g., UE84785)
   * @param {object} config - { domain: string, defaultTTL: number }
   */
  constructor(apiKey, accountNo, config = {}) {
    this.apiKey = apiKey;
    this.accountNo = accountNo;
    this.domain = config.domain || 'stri.be';
    this.defaultTTL = config.defaultTTL || 300;
  }

  /**
   * Create or update a pet subdomain using DDNS endpoint
   * @param {string} petName - The pet's name (subdomain)
   * @param {string|null} ip - Optional IP address to set (defaults to requester's IP)
   * @returns {Promise<{hostname: string, status: string}>}
   */
  async createOrUpdatePetSubdomain(petName, ip = null) {
    this.validateDomainName(petName);
    const hostname = `${petName.toLowerCase()}.${this.domain}`;
    let url = `https://api.simply.com/2/ddns/?domain=${this.domain}&hostname=${hostname}`;
    if (ip) url += `&myip=${ip}`;
    const auth = typeof btoa === 'function'
      ? btoa(`${this.accountNo}:${this.apiKey}`)
      : Buffer.from(`${this.accountNo}:${this.apiKey}`).toString('base64');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}` }
    });
    const text = await res.text();
    if (!res.ok || !text.startsWith('good')) {
      throw new Error(`DDNS failed: ${text}`);
    }
    return { hostname, status: 'created/updated' };
  }

  /**
   * Validate a pet subdomain name (simple check)
   */
  validateDomainName(name) {
    if (!name || !/^[a-z0-9-]{1,63}$/i.test(name)) {
      throw new Error('Invalid subdomain name. Only alphanumeric and hyphens allowed, 1-63 chars.');
    }
  }
}

export default DNSManager; 