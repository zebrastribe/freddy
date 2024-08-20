// modules/translation/translation.js
export class Translation {
    constructor(language) {
      this.language = language;
      this.translations = {};
    }
  
    async loadTranslations() {
      try {
        const response = await fetch(`./modules/translation/json/${this.language}.json`);
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