# Freddy - Where are you? 🐈

A location tracking web application for Freddy the adventurous ginger cat. Users can check in when they meet Freddy, providing their name and GPS coordinates, which are stored and displayed on an interactive map.

## 🌟 Features

- **Multi-language Support**: English and Danish translations
- **Interactive Maps**: Google Maps integration for location display
- **Real-time Data**: Firebase Firestore for data storage
- **Anonymous Authentication**: Secure user authentication
- **Token-based Access**: URL token validation system
- **reCAPTCHA Protection**: Bot protection for check-ins
- **Push Notifications**: Firebase Cloud Messaging integration
- **Responsive Design**: Modern UI with Tailwind CSS
- **Pagination**: Browse through all check-ins
- **Modular Architecture**: Clean, maintainable code structure

## 🏗️ Architecture

The application has been refactored into a modular architecture with clear separation of concerns:

### Core Modules
- **StorageManager**: Handles localStorage operations
- **FirebaseMessaging**: Manages push notifications and FCM
- **CheckInManager**: Business logic for check-in operations
- **CheckInUI**: User interface for check-in functionality
- **MapManager**: Google Maps integration and map operations

### Feature Organization
- **Features**: Core application features (`js/features/`)
- **Lib**: Shared utilities and configurations (`js/lib/`)
- **Modules**: Reusable modules (`js/modules/`)

## 📁 Project Structure

```
freddy/
├── css/
│   └── main.css                 # Custom styles
├── img/                         # Favicon and icons
├── js/
│   ├── app.js                   # Main application logic
│   ├── firebase-setup.js        # Firebase configuration
│   ├── incoming.js              # Token management
│   ├── config.js                # API configuration
│   ├── lib/
│   │   ├── storage.js           # StorageManager class
│   │   └── firebase_config.js   # Firebase configuration
│   ├── features/
│   │   ├── notifications/
│   │   │   └── firebase_messaging.js  # Push notifications
│   │   ├── checkin/
│   │   │   ├── checkin_manager.js     # Check-in business logic
│   │   │   └── checkin_ui.js          # Check-in UI handling
│   │   └── maps/
│   │       └── map_manager.js         # Google Maps integration
│   └── modules/
│       └── translation/
│           ├── translation.js   # Translation system
│           └── json/
│               ├── en_GB.json   # English translations
│               └── da_DK.json   # Danish translations
├── tests/
│   ├── pages/                   # Test pages
│   │   ├── test_storage.html
│   │   ├── test_firebase_messaging.html
│   │   ├── test_checkin_system.html
│   │   ├── test_map_system.html
│   │   ├── test_integration.html
│   │   ├── test.html
│   │   └── recaptcha-debug.html
│   └── *.spec.js               # Test specifications
├── admin/
│   └── index.html              # Admin interface
├── functions/                  # Firebase Cloud Functions
├── index.html                  # Main application page
├── admin.html                  # Admin page
├── _config.yml                 # GitHub Pages configuration
├── firebase.json              # Firebase configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── firebase-messaging-sw.js   # Service worker for notifications
├── manifest.json              # PWA manifest
├── package.json               # Project dependencies and scripts
├── DEPLOYMENT.md              # Deployment guide
├── SECURITY_IMPROVEMENTS.md   # Security documentation
├── PUSH_NOTIFICATIONS_SETUP.md # Notification setup guide
├── RECAPTCHA_FIXES.md         # reCAPTCHA documentation
└── README.md                  # This file
```

## 🔧 Setup & Installation

### Prerequisites
- Modern web browser with geolocation support
- Google Cloud Console access (for Maps API)
- Firebase project (for data storage)
- reCAPTCHA account (for bot protection)

### Local Development
1. Clone the repository
2. Install dependencies (optional):
   ```bash
   npm install
   ```
3. Start a local server:
   ```bash
   npm start
   # or
   python3 -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser
5. Run tests: `http://localhost:8000/tests/pages/`

### Available Scripts
- `npm start` - Start development server
- `npm run dev` - Start development server (alias)
- `npm test` - Show test instructions
- `npm run build` - No build step required (static site)
- `npm run deploy` - Show deployment instructions

## 🧪 Testing

The project includes comprehensive test pages for each module:

- **Storage Tests**: `tests/pages/test_storage.html`
- **Firebase Messaging Tests**: `tests/pages/test_firebase_messaging.html`
- **Check-in System Tests**: `tests/pages/test_checkin_system.html`
- **Map System Tests**: `tests/pages/test_map_system.html`
- **Integration Tests**: `tests/pages/test_integration.html`
- **API Tests**: `tests/pages/test.html`
- **reCAPTCHA Debug**: `tests/pages/recaptcha-debug.html`

## 🚀 Deployment to GitHub Pages

### Quick Setup
1. Create a GitHub repository named `freddy`
2. Push your code to the repository
3. Go to Settings > Pages
4. Select "Deploy from a branch" → "main" branch → "/ (root)"
5. Your site will be available at `https://yourusername.github.io/freddy`

### API Configuration Required
Before deployment, you need to configure:

1. **Google Maps API**:
   - Enable Maps JavaScript API in Google Cloud Console
   - Restrict API key to `*.github.io/*`
   - Update `js/config.js` with your API key

2. **reCAPTCHA**:
   - Create reCAPTCHA v3 site
   - Add `yourusername.github.io` to domains
   - Update site key in `js/config.js`

3. **Firebase**:
   - Add GitHub Pages domain to authorized domains
   - Update security rules if needed

See `DEPLOYMENT.md` for detailed instructions.

## 🐛 Troubleshooting

### Common Issues

1. **Maps Not Loading**
   - Check Google Maps API key restrictions
   - Verify billing is enabled on Google Cloud project
   - Check browser console for errors

2. **reCAPTCHA Issues**
   - Verify site key is correct
   - Check domain is added to reCAPTCHA settings
   - Ensure reCAPTCHA v3 is selected

3. **Firebase Authentication**
   - Check if domain is authorized in Firebase console
   - Review Firestore security rules
   - Verify Firebase configuration

4. **ES6 Modules Not Loading**
   - Ensure `_config.yml` is present
   - Check GitHub Pages is using Jekyll
   - Verify all import paths are correct

5. **Push Notifications Not Working**
   - Check Firebase Cloud Messaging setup
   - Verify service worker registration
   - Check browser notification permissions

### Debug Steps
1. Open browser Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed API requests
4. Use test pages in `tests/pages/` to verify individual modules

## 🔐 Security Notes

- API keys are currently exposed in client-side code
- For production, consider using environment variables
- Always restrict API keys to specific domains
- Regularly rotate API keys
- Monitor usage and costs

## 📝 API Keys Used

- **Google Maps**: `AIzaSyBd3xQgm7vnL2LCmxpabVT5qAhSFOteuGY`
- **reCAPTCHA**: `6LdA7jIqAAAAAKYtion4hiHa7R--TT3maGb0EpNZ`
- **Firebase**: `AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss`

⚠️ **Important**: These keys may need to be updated or restricted for production use.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using the test pages
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console errors
3. Use the test pages in `tests/pages/` to verify modules
4. Check `DEPLOYMENT.md` for detailed guidance
5. Create an issue in the repository

## 🎯 Next Steps

1. **Deploy to GitHub Pages** following the deployment guide
2. **Update API keys** with proper domain restrictions
3. **Test all functionality** on the live site
4. **Monitor usage** and costs
5. **Add additional features** as needed

---

**Happy tracking Freddy's adventures! 🐱🗺️**
