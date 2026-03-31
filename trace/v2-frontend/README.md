# Trace V2 Frontend

This is the V2 frontend for the Trace multi-user, multi-pet tracking platform. It uses Tailwind CSS v4, Vite, and Firebase integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build CSS (watch mode)
npm run build-css
```

## 📁 Project Structure

```
v2-frontend/
├── public/                 # Static assets
│   ├── img/               # Images and icons
│   └── assets/            # Other static files
├── src/
│   ├── features/          # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── pets/          # Pet management
│   │   ├── checkins/      # Check-in system
│   │   ├── maps/          # Google Maps integration
│   │   └── admin/         # Admin panel (copied from old)
│   ├── pages/             # Page components
│   ├── shared/            # Shared utilities
│   │   ├── firebase.js    # Firebase configuration
│   │   ├── router.js      # Client-side routing
│   │   └── lib/           # Third-party libraries
│   └── main.js            # Application entry point
├── styles/
│   └── tailwind-input.css # Tailwind v4 configuration
└── index.html             # Main HTML file
```

## 🛠️ Technology Stack

- **Vite** - Modern build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **Firebase** - Backend services (Auth, Firestore)
- **Vanilla JavaScript** - No framework, pure JS
- **ES Modules** - Modern JavaScript modules

## 🎯 Features

### ✅ Implemented
- [x] Modern project structure
- [x] Tailwind v4 setup with custom components
- [x] Client-side routing
- [x] Firebase integration
- [x] Basic page components
- [x] Development environment

### 🚧 In Progress
- [ ] Authentication system
- [ ] Pet management
- [ ] Check-in functionality
- [ ] Google Maps integration
- [ ] Admin panel integration

### 📋 Planned
- [ ] Real-time updates
- [ ] Push notifications
- [ ] Offline support
- [ ] Progressive Web App features

## 🔧 Development

### Prerequisites
- Node.js >= 16.0.0
- Firebase CLI (for emulators)

### Setup
1. Install dependencies: `npm install`
2. Start Firebase emulators: `npm run emulators:start` (from root)
3. Start development server: `npm run dev`
4. Build CSS: `npm run build-css`

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run build-css` - Build Tailwind CSS
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## 🌐 Routes

- `/` - Home page
- `/checkin` - Check-in form
- `/map` - Pet locations map
- `/history` - Check-in history
- `/user/:userId` - User's pets
- `/user/:userId/pet/:petName` - Specific pet
- `/admin` - Admin panel

## 🔗 Integration

This frontend integrates with:
- **Firebase Auth** - User authentication
- **Firestore** - Data storage
- **Google Maps** - Location tracking
- **Admin Panel** - Management interface

## 📚 Documentation

See the main project documentation:
- `docs/TRACE_TECHNICAL_DOCUMENTATION.md`
- `docs/FRONTEND_OVERHAUL_GUIDE.md`

## 🤝 Contributing

1. Follow the established code structure
2. Use Tailwind v4 utility classes
3. Write clean, documented code
4. Test thoroughly before committing

## 📄 License

MIT License - see LICENSE file for details 