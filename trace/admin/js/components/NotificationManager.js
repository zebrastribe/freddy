export class NotificationManager {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.deviceTokens = [];
        this.pets = [];
        this.petMap = {};
        this.isGlobalDeviceLinked = false;
        this.sortColumn = 'timestamp';
        this.sortDirection = 'desc';
    }

    async init() {
        console.log('🔔 Initializing Notification Manager...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load pets for pet name mapping
        const firebase = this.adminApp.getService('firebase');
        this.pets = await firebase.getPets();
        this.petMap = {};
        this.pets.forEach(pet => { this.petMap[pet.id] = pet.name || pet.id; });
        
        // Load initial data
        await this.loadDeviceTokens();
        await this.checkGlobalDeviceStatus();
        
        console.log('✅ Notification Manager initialized');
    }

    setupEventListeners() {
        const refreshNotificationsBtn = document.getElementById('refreshNotificationsBtn');
        const testNotificationBtn = document.getElementById('testNotificationBtn');
        const linkGlobalDeviceBtn = document.getElementById('linkGlobalDeviceBtn');
        const unlinkGlobalDeviceBtn = document.getElementById('unlinkGlobalDeviceBtn');

        if (refreshNotificationsBtn) {
            refreshNotificationsBtn.addEventListener('click', () => this.loadDeviceTokens());
        }

        if (testNotificationBtn) {
            testNotificationBtn.addEventListener('click', () => this.testGlobalNotification());
        }

        if (linkGlobalDeviceBtn) {
            linkGlobalDeviceBtn.addEventListener('click', () => this.linkGlobalDevice());
        }

        if (unlinkGlobalDeviceBtn) {
            unlinkGlobalDeviceBtn.addEventListener('click', () => this.unlinkGlobalDevice());
        }
    }

    async loadDeviceTokens() {
        const notificationsSection = document.getElementById('notificationsSection');
        if (!notificationsSection) return;

        // Show loading spinner
        notificationsSection.innerHTML = `<div id="notificationsLoading" class="flex justify-center items-center py-8"><span class="text-gray-500">Loading device tokens...</span></div>`;

        try {
            const firebase = this.adminApp.getService('firebase');
            this.deviceTokens = await firebase.getDeviceTokens();
            this.sortDeviceTokens();

            // Render refresh button and table
            notificationsSection.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <button id="refreshNotificationsBtn" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Refresh</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white rounded-lg shadow">
                        <thead>
                            <tr>
                                <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 cursor-pointer" data-sort="petId">Pet</th>
                                <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 cursor-pointer" data-sort="deviceName">Device</th>
                                <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 cursor-pointer" data-sort="userId">User</th>
                                <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 cursor-pointer" data-sort="token">Token</th>
                                <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 cursor-pointer" data-sort="timestamp">Date/Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.deviceTokens.map(token => `
                                <tr class="border-b last:border-none">
                                    <td class="px-4 py-2 text-gray-900">${this.getPetName(token.petId)}</td>
                                    <td class="px-4 py-2 text-gray-900">${token.deviceName || token.device || ''}</td>
                                    <td class="px-4 py-2 text-gray-600">${token.userId || token.user || ''}</td>
                                    <td class="px-4 py-2 text-gray-400">${token.token}</td>
                                    <td class="px-4 py-2 text-gray-500">${this.formatTime(token.timestamp)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            this.setupEventListeners();
            // Add sorting event listeners
            notificationsSection.querySelectorAll('th[data-sort]').forEach(th => {
                th.addEventListener('click', (e) => {
                    const col = th.getAttribute('data-sort');
                    if (this.sortColumn === col) {
                        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.sortColumn = col;
                        this.sortDirection = 'asc';
                    }
                    this.sortDeviceTokens();
                    this.loadDeviceTokens();
                });
            });
        } catch (error) {
            notificationsSection.innerHTML = `<div class="text-red-600">Failed to load device tokens: ${error.message}</div>`;
            console.error('Error loading device tokens:', error);
        }
    }

    async checkGlobalDeviceStatus() {
        // Check if current device is linked for global notifications
        const globalDevice = this.deviceTokens.find(device => 
            device.type === 'global_notification' && 
            device.userId === this.adminApp.getCurrentUser()?.uid
        );

        this.isGlobalDeviceLinked = !!globalDevice;
        this.updateGlobalDeviceUI();
    }

    updateGlobalDeviceUI() {
        const globalDeviceStatus = document.getElementById('globalDeviceStatus');
        const linkGlobalDeviceBtn = document.getElementById('linkGlobalDeviceBtn');
        const unlinkGlobalDeviceBtn = document.getElementById('unlinkGlobalDeviceBtn');

        if (globalDeviceStatus) {
            globalDeviceStatus.innerHTML = this.isGlobalDeviceLinked 
                ? '<div class="text-green-600 font-medium">✅ Device linked for global notifications</div>'
                : '<div class="text-gray-600">❌ No device linked for global notifications</div>';
        }

        if (linkGlobalDeviceBtn) {
            linkGlobalDeviceBtn.style.display = this.isGlobalDeviceLinked ? 'none' : 'inline-block';
        }

        if (unlinkGlobalDeviceBtn) {
            unlinkGlobalDeviceBtn.style.display = this.isGlobalDeviceLinked ? 'inline-block' : 'none';
        }
    }

    renderDeviceLinks() {
        const deviceLinksGrid = document.getElementById('deviceLinksGrid');
        if (!deviceLinksGrid) return;

        deviceLinksGrid.innerHTML = this.deviceTokens.map(device => this.createDeviceCard(device)).join('');
    }

    createDeviceCard(device) {
        const petName = device.petId ? `for ${this.getPetName(device.petId)}` : 'for all pets';
        
        return `
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">${device.deviceName}</div>
                        <div class="text-sm text-gray-600">${petName}</div>
                        <div class="text-xs text-gray-500">${this.formatTime(device.timestamp)}</div>
                    </div>
                    <button class="ml-3 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" onclick="adminPanel.getComponent('notifications').unlinkDevice('${device.id}')">
                        ❌
                    </button>
                </div>
            </div>
        `;
    }

    getPetName(petId) {
        if (!petId) return '-';
        return this.petMap[petId] || petId;
    }

    formatTime(date) {
        if (!date) return '-';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (d instanceof Date && !isNaN(d)) {
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        }
        return '-';
    }

    sortDeviceTokens() {
        const col = this.sortColumn;
        const dir = this.sortDirection;
        this.deviceTokens.sort((a, b) => {
            let va = a[col], vb = b[col];
            if (col === 'timestamp') {
                va = va ? new Date(va) : 0;
                vb = vb ? new Date(vb) : 0;
            }
            if (va < vb) return dir === 'asc' ? -1 : 1;
            if (va > vb) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    async linkGlobalDevice() {
        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                this.adminApp.toastService?.show('Notification permission denied', 'error');
                return;
            }

            // Simulate linking device
            const deviceData = {
                id: 'global-device-' + Date.now(),
                token: 'demo-global-token',
                petId: null,
                userId: this.adminApp.getCurrentUser()?.uid || 'admin-user',
                deviceName: this.getDeviceName(),
                timestamp: new Date(),
                type: 'global_notification'
            };

            this.deviceTokens.push(deviceData);
            this.isGlobalDeviceLinked = true;
            
            this.updateGlobalDeviceUI();
            this.renderDeviceLinks();
            
            this.adminApp.toastService?.show('Device linked for global notifications', 'success');
            
        } catch (error) {
            console.error('Error linking global device:', error);
            this.adminApp.toastService?.show('Failed to link device', 'error');
        }
    }

    async unlinkGlobalDevice() {
        try {
            // Remove global device from list
            this.deviceTokens = this.deviceTokens.filter(device => 
                !(device.type === 'global_notification' && device.userId === this.adminApp.getCurrentUser()?.uid)
            );
            
            this.isGlobalDeviceLinked = false;
            this.updateGlobalDeviceUI();
            this.renderDeviceLinks();
            
            this.adminApp.toastService?.show('Device unlinked from global notifications', 'success');
            
        } catch (error) {
            console.error('Error unlinking global device:', error);
            this.adminApp.toastService?.show('Failed to unlink device', 'error');
        }
    }

    async unlinkDevice(deviceId) {
        try {
            this.deviceTokens = this.deviceTokens.filter(device => device.id !== deviceId);
            this.renderDeviceLinks();
            
            this.adminApp.toastService?.show('Device unlinked', 'success');
        } catch (error) {
            console.error('Error unlinking device:', error);
            this.adminApp.toastService?.show('Failed to unlink device', 'error');
        }
    }

    async testGlobalNotification() {
        try {
            // Simulate sending test notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Freddy Admin Test', {
                    body: 'This is a test notification from the admin panel',
                    icon: '/img/emoji-cat-192x192.png'
                });
            }
            
            this.adminApp.toastService?.show('Test notification sent', 'success');
        } catch (error) {
            console.error('Error sending test notification:', error);
            this.adminApp.toastService?.show('Failed to send test notification', 'error');
        }
    }

    getDeviceName() {
        return navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device';
    }
} 