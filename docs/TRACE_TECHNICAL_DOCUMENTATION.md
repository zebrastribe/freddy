# Trace Multi-User Pet Platform  
**Technical Documentation**

---

## **1. System Overview**

Trace is a multi-user, multi-pet tracking platform built on Firebase, supporting real-time check-ins, Google Maps integration, notifications, and robust role-based access. The system is designed for both public (guest) and authenticated/admin users, with a modern, responsive UI built using Tailwind CSS v4 (JIT).

### **Key Features**
- **Multi-User Support:** Role-based access (Superadmin, Admin, User, Guest)
- **Multi-Pet Management:** Each user can own multiple pets
- **Real-time Check-ins:** GPS location tracking with timestamps
- **Google Maps Integration:** Visual pet location tracking
- **Push Notifications:** Device token management and alerts
- **Modern UI:** Tailwind CSS v4 with JIT compilation
- **SPA Architecture:** Single Page Application with client-side routing

---

## **2. Technical Architecture**

### **2.1 Firebase Configuration**

#### **Services Used**
- **Authentication:** Email/password authentication with emulator support for local development
- **Firestore:** NoSQL database for pets, users, check-ins, and notification data
- **Cloud Messaging:** Device tokens for push notifications (optional)

#### **Emulator Support**
- Local development uses Firebase emulators for Auth and Firestore
- Test users and data are set up via scripts (`setup-users-after-emulators.js`)
- Emulator data is exported/imported for consistent development environment

#### **Config Management**
- Firebase config is loaded from a central file (`js/lib/firebase_config.js`)
- API keys (Firebase, Google Maps) are managed in config and injected at runtime
- Environment-specific configuration for development vs production

#### **Security**
- Firestore rules enforce role-based access and data integrity
- Emulator rules are tested via scripts and HTML test harnesses
- Client-side permission checks complement server-side security

### **2.2 Multi-Pet Setup**

#### **Pet Ownership**
- Each pet is associated with a user (owner) via Firestore references
- Pets can be managed by their owner, admins, or superadmins
- Pet data includes: name, owner, status, location history, and metadata

#### **Notifications**
- Device tokens are stored per user for push notifications
- Owners receive notifications for check-ins, status changes, and missing pet alerts
- Notification preferences can be managed per user

#### **Missing Pet Functionality**
- Owners/admins can mark pets as missing
- Missing pets are highlighted in the UI and can trigger notifications
- Status tracking includes: active, missing, found, archived

#### **Check-in System**
- Supports multiple pets per user
- Check-ins include location (GPS), timestamp, and optional notes
- Historical data is preserved for analytics and tracking

### **2.3 User Setup and Roles**

#### **Role Hierarchy**
- **Superadmin:** Full access to all data, users, and system settings
- **Admin:** Manage users, pets, and system settings (but not superadmin-only features)
- **User:** Manage their own pets and check-ins
- **Guest:** Public/anonymous access, can view pets and check-ins, but cannot modify data

#### **Role Assignment**
- Roles are assigned in Firestore and Auth emulator during setup
- Role-based UI and API access enforced throughout the app
- Permission middleware validates actions based on user role

#### **Test Users**
- Predefined users for each role are created during emulator setup
- Passwords and emails are documented for local testing
- Test data includes sample pets and check-ins

### **2.4 Tailwind JIT v4 Usage**

#### **Tailwind Usage (v4 CDN for Development)**
- For rapid development and prototyping, the project uses the Tailwind v4 browser CDN:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style type="text/tailwindcss">
    @theme {
      --color-clifford: #da373d;
    }
  </style>
  ```
- This approach is used in both the admin panel and v2-frontend for instant access to all Tailwind classes and features, without a build step.
- For production, a build system (e.g., `@tailwindcss/cli` with JIT) may be used to generate a minimal CSS file for optimal performance.
- All UI is built using Tailwind utility classes—no custom CSS except for rare overrides.
- Responsive, accessible, and modern design patterns throughout.
- Consistent spacing, colors, and typography across all components.

#### **Build System**
- Uses `@tailwindcss/cli` v4.1.11 with JIT mode for fast, on-demand CSS generation
- Input: `css/tailwind-input.css` (with `@import "tailwindcss";` and `@source`)
- Output: `css/tailwind.css` (served to all pages)

#### **Development Workflow**
- `npm run build-css` watches for changes and rebuilds CSS instantly
- All HTML/JS-injected markup uses only Tailwind v4 classes
- Hot reloading ensures immediate visual feedback

---

## **3. Frontend & Admin System Analysis**

### **3.1 Public Frontend (Guest)**

#### **Check-in (Multi-pet)**
- Guests can check in pets by selecting from a list or entering a pet name
- Check-in form is modern, accessible, and mobile-friendly
- GPS location capture with user permission
- Form validation and error handling

#### **Google Maps Integration**
- Public map displays all pets' last known locations with markers
- Supports GPS location for new check-ins
- Interactive markers with pet information popups
- Map controls for zoom, pan, and satellite view

#### **Previous Check-ins**
- Guests can view a history of check-ins for each pet, including location on map
- Filterable by date range and pet
- Export functionality for data analysis

#### **URL Routing**
- `/` — Home/solution page
- `/[userid]` — User-specific page (shows all their pets)
- `/[userid]/[petname]` — Pet-specific page (multi-pet supported)
- `/?token=dev` — Token-based redirect for dev/testing

#### **Public Frontend (Guest) Templates & Routing**

The solution is structured around three main frontend templates/routes:

1. **`/` (Home)**
   - Entry point for the app. Placeholder for future features and landing page content.

2. **`/[userid]` (Owner's Pets)**
   - Displays all pets owned by the specified user.
   - Owners can manage their pets from this view.

3. **`/[userid]/[name]` (Multi-pet enabled)**
   - Dedicated page for a specific pet.
   - **Check-in form**: Allows both authenticated users and guests to check in the pet's location/status.
   - **Guest check-in**: Guests can submit check-ins for the pet.
   - **List of previous check-ins**: All previous check-ins for the pet are visible, including to guests.
   - **Google Maps integration**: Shows pet's check-in locations as markers on a map.
   - **Notification signup**: Guests can sign up to receive notifications about new check-ins for this pet.

These templates ensure a clear separation of concerns and a user-friendly experience for both owners and guests.

### **3.1.1 Route-to-Component Mapping (v2-frontend)**

| Route                        | Main Component/File                | Description                                                                 |
|------------------------------|-------------------------------------|-----------------------------------------------------------------------------|
| `/`                          | `src/pages/home-page.js` (planned)  | Home/landing page. Currently a placeholder; future features to be added.    |
| `/[userid]`                  | `src/pages/user-page.js`            | Shows all pets owned by the user.                                           |
| `/[userid]/[name]`           | `src/pages/object-page.js`          | Multi-object enabled: check-in, history, map, guest notification signup.    |

> **Note:** File names are based on standard conventions; adjust if your actual file names differ.

#### **Router Implementation**
- The v2-frontend uses a custom SPA router (`src/shared/router.js`) to handle client-side navigation.
- All routes are handled by the SPA server (`spa-server.js`), which serves `index.html` for all paths.
- The router parses the URL and dynamically loads the appropriate page/component.

#### **Notification Signup (Guest)**
- On `/[userid]/[name]`, guests can enter their email or device info to subscribe to notifications for that pet's check-ins.
- The UI for this is in the pet page component, and stores notification preferences in Firestore.
- Guests receive notifications when new check-ins are made for the pet.

#### **Guest Check-in Flow**
- On `/[userid]/[name]`, guests can submit a check-in form for the pet.
- The form validates required fields (e.g., location, name) and submits to Firestore.
- Guest check-ins are visible in the check-in history for the pet.

#### **Google Maps Integration**
- The pet page (`/[userid]/[name]`) includes a map (component in `src/features/maps/map-service.js`).
- Markers show all check-in locations for the pet.
- Clicking a marker shows check-in details.

#### **Example URLs**
- Home: `http://localhost:8016/`
- User's page: `http://localhost:8016/{UrlName}`
- Pet page: `http://localhost:8016/{UrlName}/fido`

#### **Current State of `/` Route**
- The `/` route is currently a placeholder/landing page. No major features are implemented yet, but it is reserved for future expansion.

### **3.2 Admin Panel**

#### **User Management**
- List, search, and manage users
- Assign roles, reset passwords, and view user activity
- Bulk operations for user management
- User analytics and activity tracking

#### **Pet Management**
- List, search, and manage all pets
- Edit pet details, assign owners, mark as missing, delete pets
- Pet analytics and check-in history
- Bulk pet operations

#### **Notifications**
- View and manage device tokens
- Send test notifications to users/devices
- Notification history and delivery status
- Template management for common notifications

#### **System Controls**
- Import/export data, backup, clear cache, reset system
- View system info and logs
- Performance monitoring and debugging tools
- Database maintenance and cleanup

#### **UI/UX**
- All admin pages use Tailwind v4 for a modern, consistent look
- Responsive layouts, accessible forms, and clear navigation
- Dashboard with key metrics and quick actions

### **3.3 Google Maps & Check-in Integration**

#### **Maps**
- Google Maps API is loaded dynamically
- Maps are only initialized if the container element exists (prevents errors on non-map pages)
- Markers show pet locations; clicking a marker shows pet info
- Custom map styling and controls

#### **Check-in**
- Check-in form supports GPS location, notes, and pet selection
- Submissions update Firestore and trigger notifications
- Real-time updates across all connected clients
- Offline support with sync when connection is restored

### **3.4 URL Routing & SPA Server**

#### **SPA Routing**
- All routes are handled by the SPA server (`spa-server.js`), which serves `index.html` for all paths
- Client-side router (`js/router.js`) handles dynamic rendering based on the URL
- Deep linking support for all routes
- Browser history management

#### **Static Assets**
- CSS, JS, and images are served statically from the root directory
- Optimized asset loading and caching
- CDN-ready static file structure

### **3.5 URL Name System (urlName) for Public User and Pet Pages**

#### **Purpose**
The `urlName` is a unique, human-friendly identifier assigned to each user in the Trace platform. It is used to generate clean, memorable public URLs for user and pet pages, enabling easy sharing and navigation.

#### **How urlName is Generated**
- When a new user is created, the system uses the `UrlNameManager` to assign a unique `urlName`.
- The pool of possible names is based on a curated list of mythology names (see `mythology-names.js`).
- If all mythology names are taken, the system appends a number to create a unique variant (e.g., `apollo-2`).
- The assigned `urlName` is stored in both the user's Firestore document and a central `url_names` collection for fast lookup and collision prevention.

#### **How urlName is Used**
- **User Public Page:**  
  - Accessible at: `http://localhost:8016/{urlName}`  
  - Shows all pets owned by the user.
- **Pet Public Page:**  
  - Accessible at: `http://localhost:8016/{urlName}/{petName}`  
  - Shows details and check-in history for a specific pet.
- The admin panel displays each user's `urlName` and provides a direct public link for each pet card, making it easy to copy or share.

#### **Technical Details**
- The `UrlNameManager` handles:
  - Flattening the mythology names list.
  - Ensuring uniqueness by checking the `url_names` collection.
  - Assigning and updating `urlName` fields in Firestore.
  - Providing lookup utilities for both userId → urlName and urlName → userId.
- The admin UI and frontend use the `urlName` to construct all public-facing URLs.

#### **Example**
- User: `zeus`
- Pet: `fido`
- **User page:** `http://localhost:8016/zeus`
- **Pet page:** `http://localhost:8016/zeus/fido`

### **3.6 Short URL System for Pets**

#### **Purpose**
The Short URL System provides unique, memorable URLs for individual pets that can be used in QR codes, social media, and other sharing scenarios. This system ensures each pet has a globally unique identifier that works across different domains and platforms.

#### **Current Implementation**
- **Legacy Support:** The pet "freddy" uses the existing short URL `freddy.stri.be` which redirects to `https://zebrastribe.github.io/freddy/` with a token for check-in purposes.
- **Future Expansion:** New pets will use the format `[petname]-[urlname].stri.be` to ensure uniqueness when multiple pets share the same name.

#### **URL Structure**
- **Legacy Format:** `[petname].stri.be` (for existing pets like freddy)
- **New Format:** `[petname]-[urlname].stri.be` (for future pets to ensure uniqueness)
- **Fallback:** If a subdomain is already taken, the system will append additional identifiers as needed.

#### **Technical Implementation**
- **Domain Management:** Short URLs are managed through DNS and redirect services (e.g., Cloudflare, Netlify, or custom redirect logic).
- **Token Integration:** Each short URL includes a token parameter for check-in authentication and tracking.
- **QR Code Generation:** Admin panel provides QR code generation for each pet's short URL.
- **Analytics:** Short URL clicks can be tracked for pet popularity and engagement metrics.

#### **Database Schema**
- **Pet Collection:** Each pet document includes:
  - `shortUrl`: The unique short URL (e.g., "freddy.stri.be" or "max-zeus.stri.be")
  - `urlName`: The owner's URL name for constructing the full path
  - `petName`: The pet's name for display and routing
  - `token`: Optional token for check-in authentication

#### **Admin Panel Integration**
- **Short URL Management:** Admin panel displays each pet's short URL and provides copy/share functionality.
- **QR Code Generation:** Automatic QR code generation for each pet's short URL.
- **URL Validation:** System validates short URL uniqueness and provides suggestions for conflicts.
- **Bulk Operations:** Support for bulk short URL generation and management.

#### **Example URLs**
- **Legacy Pet:** `freddy.stri.be` → `https://zebrastribe.github.io/freddy/?token=abc123`
- **New Pet:** `max-zeus.stri.be` → `https://zebrastribe.github.io/zeus/max/?token=def456`
- **Conflict Resolution:** `buddy-ares.stri.be` → `https://zebrastribe.github.io/ares/buddy/?token=ghi789`

#### **Token System**
- **Purpose:** Tokens provide secure check-in access without requiring user authentication.
- **Generation:** Tokens are generated automatically when short URLs are created.
- **Validation:** Frontend validates tokens before allowing check-ins.
- **Security:** Tokens can be regenerated or revoked through the admin panel.

#### **Future Considerations**
- **Custom Domains:** Support for custom domains per user or organization.
- **Branded URLs:** Custom short URL patterns for different user groups.
- **Analytics Dashboard:** Detailed analytics for short URL usage and engagement.
- **API Integration:** REST API for programmatic short URL management.

### **3.7 GitHub Pages Deployment & Repository Migration**

#### **Current Setup**
- **Repository Name:** `freddy` (legacy)
- **GitHub Pages URL:** `https://zebrastribe.github.io/freddy/`
- **Deployment Source:** GitHub Pages from main branch
- **Custom Domain:** None (using GitHub Pages subdomain)

#### **Migration Plan: freddy → trace**
- **New Repository:** Create `trace` repository under the same GitHub account
- **New GitHub Pages URL:** `https://zebrastribe.github.io/trace/`
- **Transfer Scope:** Only the `trace/` folder needs to be moved to the new repository
- **Simplified Migration:** The entire project structure is contained within the `trace/` directory

#### **Migration Steps**
1. **Create New Repository:**
   ```bash
   # Create new repository on GitHub named 'trace'
   # Clone the new repository locally
   git clone https://github.com/zebrastribe/trace.git
   cd trace
   ```

2. **Transfer Project Files:**
   ```bash
   # Copy only the trace folder contents to the new repository
   cp -r /path/to/freddy/trace/* .
   ```

3. **Update Configuration:**
   - Update any hardcoded references from `freddy` to `trace`
   - Update GitHub Pages settings to deploy from main branch
   - Verify all relative paths work correctly

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Initial migration from freddy to trace"
   git push origin main
   ```

#### **Project Structure in New Repository**
```
trace/
├── v2-frontend/          # Main frontend application
│   ├── src/             # Source code
│   ├── public/          # Static assets
│   ├── package.json     # Frontend dependencies
│   └── vite.config.js   # Vite configuration
├── admin/               # Admin panel
│   ├── js/             # Admin JavaScript
│   ├── css/            # Admin styles
│   ├── package.json    # Admin dependencies
│   └── index.html      # Admin entry point
├── add-url-names.cjs   # URL name management
└── mythology-names.json # Mythology name data
```

#### **Migration Impact Analysis**
- **URL Changes:** From `freddy` to `trace` subdomain
- **Configuration Updates:** Minimal - only repository name references
- **Development Workflow:** Unchanged - same local development process
- **Deployment:** Same GitHub Pages workflow

#### **Benefits of Simplified Migration**
- **Minimal Risk:** Only moving the core project files
- **Clean Start:** New repository without legacy files
- **Focused Scope:** Only the essential application code
- **Easy Rollback:** Original `freddy` repository remains intact

#### **Post-Migration Tasks**
1. **Update Documentation:** All references to old repository
2. **Update CI/CD:** Any GitHub Actions or deployment scripts
3. **Update Links:** Any external references to the old URL
4. **Test Deployment:** Verify GitHub Pages works correctly
5. **Update Short URLs:** Redirect `freddy.stri.be` to new `trace` URL

#### **Legacy Support**
- **freddy.stri.be:** Continue to redirect to `https://zebrastribe.github.io/freddy/`
- **New Short URLs:** Use `[petname]-[urlname].stri.be` format
- **Backward Compatibility:** Maintain support for existing pet pages during transition

---

## **4. Additional Critical Aspects**

### **4.1 Accessibility**
- All forms and navigation are keyboard-accessible
- ARIA labels and roles are used where appropriate
- Screen reader compatibility
- High contrast mode support

### **4.2 Testing**
- Jest-based unit tests for core logic
- HTML test harnesses for manual and integration testing
- Automated testing for critical user flows
- Performance testing and monitoring

### **4.3 Localization**
- Translation support via JSON files (`js/modules/translation/json/`)
- UI can be easily localized for different languages
- RTL language support
- Date and number formatting per locale

### **4.4 Security**
- Firestore rules and client-side checks prevent unauthorized access
- Emulator-only credentials for local development
- Input validation and sanitization
- CSRF protection and secure headers

### **4.5 Performance**
- JIT Tailwind build keeps CSS size minimal
- Lazy loading of maps and data for fast initial load
- Image optimization and compression
- Caching strategies for static assets

### **4.6 Error Handling**
- Comprehensive error boundaries
- User-friendly error messages
- Graceful degradation for offline scenarios
- Logging and monitoring for debugging

---

## **5. Development Environment**

### **5.1 Prerequisites**
- Node.js >= 16.0.0
- npm or yarn package manager
- Firebase CLI (for emulator management)
- Git for version control

### **5.2 Setup Commands**
```bash
# Install dependencies
npm install

# Start Firebase emulators with test users
npm run emulators:start

# Start the SPA server
npm start

# Build Tailwind CSS (watch mode)
npm run build-css
```

### **5.3 Available Scripts**
- `npm start` - Start the SPA server
- `npm run dev` - Start with nodemon for development
- `npm run emulators:start` - Start Firebase emulators with test data
- `npm run build-css` - Build Tailwind CSS with watch mode
- `npm test` - Run Jest tests

### **5.4 Test Users**
- `guest@test.com` (guest) - password: password123
- `user@test.com` (user) - password: password123
- `admin@test.com` (admin) - password: password123
- `superadmin@test.com` (superadmin) - password: password123

---

## **6. Deployment Considerations**

### **6.1 Production Setup**
- Configure Firebase project for production
- Set up proper security rules
- Configure domain and SSL certificates
- Set up monitoring and logging

### **6.2 Environment Variables**
- Firebase config for production
- Google Maps API key
- Notification service configuration
- Database connection settings

### **6.3 Performance Optimization**
- Minify and compress assets
- Enable gzip compression
- Configure CDN for static assets
- Optimize images and media files

---

## **7. Troubleshooting**

### **7.1 Common Issues**
- Port conflicts with emulators
- Tailwind build errors
- Firebase connection issues
- Map initialization errors

### **7.2 Debug Tools**
- Browser developer tools
- Firebase emulator UI
- Console logging and debugging
- Network request monitoring

---

## **8. Future Enhancements**

### **8.1 Planned Features**
- Real-time collaboration
- Advanced analytics dashboard
- Mobile app development
- API for third-party integrations

### **8.2 Technical Improvements**
- Service worker for offline support
- Progressive Web App features
- Advanced caching strategies
- Performance optimizations

---

*This documentation serves as a comprehensive technical reference for the Trace Multi-User Pet Platform. For questions or contributions, please refer to the project repository.* 