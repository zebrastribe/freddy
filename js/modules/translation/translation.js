// modules/translation.js
export class Translation {
    constructor() {
      this.language = this.detectLanguage();
      this.translations = {};
    }
  
    detectLanguage() {
      const supportedLanguages = ['en_GB', 'da_DK'];
      const browserLanguage = navigator.language || navigator.userLanguage || 'en_GB';
      return supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en_GB';
    }
  
    async loadTranslations() {
      try {
        const response = await fetch(`./json/${this.language}.json`);
        this.translations = await response.json();
      } catch (error) {
        console.error('Error loading translation file:', error);
      }
    }
  
    translate(key) {
      return this.translations[key] || key;
    }
  
    applyTranslations() {
      document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = this.translate(key);
      });
    }
  }