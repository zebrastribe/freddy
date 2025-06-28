# Freddy - Deployment Guide

## Overview
This guide helps you deploy the Freddy application to GitHub Pages and troubleshoot common API issues.

## Prerequisites
- GitHub account
- Google Cloud Console access
- Firebase project access

## GitHub Pages Deployment

### 1. Repository Setup
1. Create a new repository on GitHub named `freddy`
2. Push your code to the repository
3. Go to Settings > Pages
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"

### 2. Enable GitHub Pages
GitHub Pages will automatically build and deploy your site. The URL will be:
`https://yourusername.github.io/freddy`

## API Configuration

### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to:
   - HTTP referrers: `*.github.io/*`
   - Your specific domain if using custom domain

### reCAPTCHA
1. Go to [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site
3. Choose reCAPTCHA v3
4. Add domains:
   - `localhost` (for development)
   - `yourusername.github.io` (for production)
5. Copy the site key and update `js/config.js`

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Add your GitHub Pages domain to authorized domains
5. Update security rules in Firestore if needed

## Troubleshooting

### Common Issues

#### 1. Google Maps Not Loading
**Symptoms:** Maps show gray tiles or error messages
**Solutions:**
- Check if Maps JavaScript API is enabled
- Verify API key restrictions
- Check browser console for errors
- Ensure billing is enabled on Google Cloud project

#### 2. reCAPTCHA Not Working
**Symptoms:** reCAPTCHA widget doesn't appear or validation fails
**Solutions:**
- Verify site key is correct
- Check domain is added to reCAPTCHA settings
- Ensure reCAPTCHA v3 is selected
- Check browser console for errors

#### 3. Firebase Authentication Issues
**Symptoms:** Users can't check in, authentication errors
**Solutions:**
- Verify Firebase config in `js/firebase-setup.js`
- Check if domain is authorized in Firebase console
- Review Firestore security rules
- Check browser console for errors

#### 4. ES6 Modules Not Loading
**Symptoms:** JavaScript errors about modules
**Solutions:**
- Ensure `_config.yml` is present (for Jekyll)
- Check if GitHub Pages is using Jekyll
- Verify all import paths are correct
- Use relative paths for imports

### Debug Steps

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

2. **Verify API Keys**
   - Test Google Maps API key in browser console
   - Check reCAPTCHA site key
   - Verify Firebase configuration

3. **Test Locally**
   - Run `python3 -m http.server 8000`
   - Visit `http://localhost:8000`
   - Check if issues persist locally

4. **Check GitHub Pages Build**
   - Go to repository Actions tab
   - Check if build is successful
   - Review build logs for errors

## Environment Variables

For production, consider using environment variables for API keys:

```javascript
// In js/config.js
export const config = {
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || 'your-api-key',
    // ... other config
  }
};
```

## Security Best Practices

1. **API Key Restrictions**
   - Always restrict API keys to specific domains
   - Use different keys for development and production
   - Regularly rotate API keys

2. **Firebase Security**
   - Set up proper Firestore security rules
   - Enable authentication
   - Monitor usage and costs

3. **HTTPS Only**
   - Ensure GitHub Pages uses HTTPS
   - Update all API configurations to require HTTPS

## Monitoring

1. **Google Cloud Console**
   - Monitor API usage and quotas
   - Check for billing alerts
   - Review error logs

2. **Firebase Console**
   - Monitor authentication usage
   - Check Firestore read/write operations
   - Review error logs

3. **GitHub Pages**
   - Check deployment status
   - Monitor build logs
   - Review site analytics

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review browser console errors
3. Check API documentation
4. Create an issue in the repository

## Updates

Keep this guide updated as you make changes to the application or APIs. 