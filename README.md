# Trace Multi-User, Multi-Pet Platform

This is the Trace platform (formerly Freddy), a modern multi-user, multi-pet tracking solution. All references to 'freddy' have been replaced with 'trace'.

A modern, scalable web application for managing pet check-ins across multiple users and pets. Built with vanilla JavaScript, Firebase, and Node.js.

## 🚀 **Features**

### ✅ **Core Functionality**
- **Multi-User Support**: Each user can manage multiple pets
- **Dynamic URLs**: `/userId/petName/` format (e.g., `/uid123/freddy/`)
- **Real-time Check-ins**: Live updates with Firebase Firestore
- **Push Notifications**: Firebase Cloud Messaging with service worker
- **Domain Management**: Automatic subdomain creation via Simply.com API
- **PWA Support**: Installable web app with offline capabilities

### 🎯 **Architecture Highlights**
- **SPA Server**: Node.js Express server with dynamic routing
- **Firebase Integration**: Firestore database with real-time listeners
- **Notification System**: Multi-user notification preferences and quiet hours
- **DNS Management**: Automated subdomain setup for each pet
- **Security**: Role-based access control and Firestore security rules

## 📦 **Quick Start**

### **Prerequisites**
- Node.js 16+ 
- Firebase CLI
- Simply.com API access (for DNS management)

### **Installation**
```bash
# Clone the repository
git clone https://github.com/zebrastribe/freddy.git
cd freddy

# Install dependencies
npm install

# Start Firebase emulator
firebase emulators:start --only firestore --import=./emulator-data --export-on-exit=./emulator-data

# Start SPA server (in another terminal)
npm start
```

### **Access the Application**
- **Home**: http://localhost:8016/
- **Pet Check-in**: http://localhost:8016/uid123/freddy/
- **Admin**: http://localhost:8016/admin/
- **Firebase Emulator UI**: http://localhost:4000/

## 🏗️ **Project Structure**

```
freddy/
├── 📁 docs/                    # Comprehensive documentation
├── 📁 js/                      # JavaScript source code
│   ├── 📁 features/           # Feature modules
│   │   ├── 📁 users/         # User management
│   │   ├── 📁 pets/          # Pet management
│   │   ├── 📁 checkin/       # Check-in system
│   │   ├── 📁 notifications/ # Push notifications
│   │   ├── 📁 maps/          # Map integration
│   │   └── 📁 infrastructure/# DNS and hosting
│   ├── 📁 lib/               # Utility libraries
│   └── 📁 modules/           # Third-party modules
├── 📁 css/                     # Stylesheets
├── 📁 img/                     # Images and icons
├── 📁 hosting/                 # Hosting configuration
├── 📁 functions/               # Firebase Cloud Functions
├── 📁 emulator-data/           # Firebase emulator data
├── 📁 migration-scripts/       # Database migration scripts
├── 📄 spa-server.js            # Node.js SPA server
├── 📄 index.html               # Main application entry point
├── 📄 firebase-messaging-sw.js # Service worker for notifications
└── 📄 package.json             # Dependencies and scripts
```

## 🔧 **Configuration**

### **Environment Setup**
1. **Firebase**: Configure `js/lib/firebase_config.js`
2. **Simply.com API**: Set up DNS manager credentials
3. **VAPID Key**: Configure for push notifications
4. **Service Worker**: Update for your domain

### **Multi-User Setup**
```javascript
// Example user and pet creation
const user = {
  userId: 'uid123',
  email: 'user@example.com',
  displayName: 'John Doe'
};

const pet = {
  petId: 'pet-uuid-123',
  userId: 'uid123',
  name: 'Freddy',
  subdomain: 'freddy.stri.be'
};
```

## 📱 **Usage**

### **For Pet Owners**
1. **Register**: Create account and add pets
2. **Share**: Share pet check-in URLs with caregivers
3. **Monitor**: Receive real-time notifications
4. **Manage**: Configure notification preferences

### **For Caregivers**
1. **Access**: Visit pet-specific check-in URL
2. **Check-in**: Submit check-in with location and notes
3. **Notify**: Pet owner receives instant notification

### **For Administrators**
1. **Monitor**: View all users and pets
2. **Manage**: Handle DNS and domain setup
3. **Support**: Access logs and system status

## 🔔 **Notification System**

### **Features**
- **Multi-User**: Each user gets notifications only for their pets
- **Quiet Hours**: Respect user's sleep schedule
- **Preferences**: Granular control over notification types
- **Background**: Works when app is closed or phone is locked

### **Configuration**
```javascript
// Notification preferences per user/pet
const preferences = {
  checkins: true,      // Check-in notifications
  daily: false,        // Daily summaries
  weekly: false,       // Weekly reports
  emergency: true,     // Emergency alerts
  quietHours: {
    start: "22:00",
    end: "08:00",
    timezone: "Europe/Copenhagen"
  }
};
```

## 🌐 **DNS Management**

### **Simply.com Integration**
- **Automatic Setup**: Creates subdomains for new pets
- **API v2**: Modern Simply.com API integration
- **Account Format**: Sxxxxxx account number format
- **Error Handling**: Robust error handling and retry logic

### **Domain Structure**
```
{petname}.stri.be → https://zebrastribe.github.io/{petname}/
```

## 🔒 **Security**

### **Firestore Rules**
- **User Isolation**: Users can only access their own data
- **Pet Ownership**: Pet owners control access to their pets
- **Check-in Validation**: Secure check-in submission
- **Admin Access**: Restricted admin functionality

### **Authentication**
- **Anonymous Auth**: Simple access for caregivers
- **User Accounts**: Full accounts for pet owners
- **Role-Based**: Different permissions for different user types

## 🧪 **Testing**

### **Unit Tests**
```bash
npm test
```

### **Integration Tests**
- **Firebase Emulator**: Local testing environment
- **Service Worker**: Notification testing
- **DNS Integration**: Simply.com API testing

### **Manual Testing**
- **SPA Routes**: Test all URL patterns
- **Notifications**: Test push notification flow
- **Multi-User**: Test user isolation

## 📚 **Documentation**

### **Architecture**
- **[Multi-User Analysis](docs/MULTI_USER_OBJECT_ANALYSIS.md)**: Comprehensive system analysis
- **[Component Architecture](docs/COMPONENT_ARCHITECTURE.md)**: Detailed component breakdown
- **[Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)**: Development roadmap

### **Setup & Deployment**
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Production deployment instructions
- **[Admin Guide](docs/ADMIN_GUIDE.md)**: Administrator documentation
- **[API Reference](docs/API_REFERENCE.md)**: API documentation

### **Development**
- **[Contributing](docs/CONTRIBUTING.md)**: Development guidelines
- **[Testing](docs/TESTING.md)**: Testing procedures
- **[Security](docs/SECURITY_IMPROVEMENTS.md)**: Security considerations
- **[Script Catalog](docs/SCRIPT_CATALOG.md)**: Canonical scripts and usage

## 🚀 **Deployment**

### **Development**
```bash
npm run dev
```

### **Production**
```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy

# Deploy to GitHub Pages
npm run deploy:gh-pages
```

### **Docker**
```bash
# Build and run with Docker
docker build -t freddy .
docker run -p 3000:3000 freddy
```

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Firebase**: Backend infrastructure and real-time database
- **Simply.com**: DNS management and domain services
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework

---

**Last Updated:** July 2025  
**Version:** 2.0.0 (Multi-User Release)  
**Status:** Production Ready
