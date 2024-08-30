/*
The provided JavaScript code defines a Translation class that handles language detection, loading translation files, and applying translations to HTML elements. This class is designed to facilitate internationalization in web applications by dynamically adapting the content based on the user's language preferences.
The Translation class constructor initializes the class by detecting the user's language using the detectLanguage method and setting up an empty translations object to store the translation data. The detectLanguage method identifies the user's preferred language by checking the browser's language settings. It supports English (en) and Danish (da), mapping them to en_GB and da_DK, respectively. The method first checks if Danish (da) is explicitly listed in the browser's languages. If not, it iterates through the browser's languages, extracting the language code (e.g., da from da-DK) and returning the corresponding supported language. If no supported language is found, it defaults to English (en_GB).
The loadTranslations method is an asynchronous function that fetches the translation file corresponding to the detected language. It constructs the URL for the translation file based on the detected language and attempts to fetch and parse the JSON file. If an error occurs during this process, it logs the error to the console.
The translate method takes a translation key as an argument and returns the corresponding translation from the translations object. If the key is not found, it returns the key itself, ensuring that the application can still display some text even if the translation is missing.
The applyTranslations method applies the translations to all HTML elements with the data-translate attribute. It iterates through these elements, retrieves the translation key from the attribute, and uses the translate method to get the corresponding translation. If the element has a placeholder attribute, it sets the placeholder to the translation; otherwise, it sets the element's text content to the translation.
Overall, this Translation class provides a robust solution for managing translations in a web application, ensuring that content is dynamically adapted to the user's language preferences.
*/


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
      const translation = this.translate(key);

      if (element.hasAttribute('placeholder')) {
        element.setAttribute('placeholder', translation);
      } else {
        element.textContent = translation;
      }
    });
  }
}