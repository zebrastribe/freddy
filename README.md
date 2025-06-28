# Freddy - Where are you? 🐈

A location tracking web application for Freddy the adventurous ginger cat. Users can check in when they meet Freddy, providing their name and GPS coordinates, which are stored and displayed on an interactive map.

## 🌟 Features

- **Multi-language Support**: English and Danish translations
- **Interactive Maps**: Google Maps integration for location display
- **Real-time Data**: Firebase Firestore for data storage
- **Anonymous Authentication**: Secure user authentication
- **Token-based Access**: URL token validation system
- **reCAPTCHA Protection**: Bot protection for check-ins
- **Responsive Design**: Modern UI with Tailwind CSS
- **Pagination**: Browse through all check-ins

## 🚀 Recent Fixes Applied

### Google APIs Issues Resolved
- ✅ Fixed duplicate map initialization conflicts
- ✅ Added proper error handling for API failures
- ✅ Improved Google Maps API loading with fallback
- ✅ Centralized API configuration in `js/config.js`
- ✅ Added comprehensive error messages for users

### Code Improvements
- ✅ Removed duplicate map initialization in `index.html`
- ✅ Added proper async/await error handling
- ✅ Improved Firebase integration consistency
- ✅ Fixed translation issues in Danish
- ✅ Added proper MIME type configuration for GitHub Pages

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
│   └── modules/
│       └── translation/
│           ├── translation.js   # Translation system
│           └── json/
│               ├── en_GB.json   # English translations
│               └── da_DK.json   # Danish translations
├── index.html                   # Main application page
├── test.html                    # API testing page
├── _config.yml                  # GitHub Pages configuration
├── DEPLOYMENT.md               # Deployment guide
└── README.md                   # This file
```

## 🔧 Setup & Installation

### Prerequisites
- Modern web browser with geolocation support
- Google Cloud Console access (for Maps API)
- Firebase project (for data storage)
- reCAPTCHA account (for bot protection)

### Local Development
1. Clone the repository
2. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser
4. Test APIs using `http://localhost:8000/test.html`

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

### Debug Steps
1. Open browser Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed API requests
4. Use `test.html` to verify individual APIs

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
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console errors
3. Use the test page (`test.html`) to verify APIs
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
