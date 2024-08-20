// modules/translation.js
export class Translation {
    constructor() {
      this.language = this.detectLanguage();
      this.translations = {};
    }
  
    detectLanguage() {
      const supportedLanguages = {
        'en': 'en_GB',
        'da': 'da_DK'
      };
      const browserLanguages = navigator.languages || [navigator.language || navigator.userLanguage || 'en'];
  
      // Explicitly check if 'da' is in browserLanguages
      if (browserLanguages.includes('da')) {
        return 'da_DK';
      }
  
      for (const lang of browserLanguages) {
        const languageCode = lang.split('-')[0]; // Extract the language code (e.g., 'da' from 'da-DK')
        if (supportedLanguages[languageCode]) {
          return supportedLanguages[languageCode];
        }
      }
  
      return 'en_GB'; // Default to English if no supported language is found
    }
  
    async loadTranslations() {
      try {
        const response = await fetch(`./js/modules/translation/json/${this.language}.json`);
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