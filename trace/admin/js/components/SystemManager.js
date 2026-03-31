// System Manager Component
export class SystemManager {
    constructor(adminApp) {
        this.adminApp = adminApp;
    }

    async init() {
        console.log('⚙️ Initializing System Manager...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load system information
        await this.loadSystemInfo();
        
        console.log('✅ System Manager initialized');
    }

    setupEventListeners() {
        const exportDataBtn = document.getElementById('exportDataBtn');
        const importDataBtn = document.getElementById('importDataBtn');
        const backupDataBtn = document.getElementById('backupDataBtn');
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        const clearDevicesBtn = document.getElementById('clearDevicesBtn');
        const resetSystemBtn = document.getElementById('resetSystemBtn');

        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }

        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => this.importData());
        }

        if (backupDataBtn) {
            backupDataBtn.addEventListener('click', () => this.backupData());
        }

        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => this.clearCache());
        }

        if (clearDevicesBtn) {
            clearDevicesBtn.addEventListener('click', () => this.clearAllDevices());
        }

        if (resetSystemBtn) {
            resetSystemBtn.addEventListener('click', () => this.resetSystem());
        }
    }

    async loadSystemInfo() {
        const systemContent = document.getElementById('systemSection');
        if (!systemContent) return;

        // Dummy data for demonstration
        const info = {
            version: '1.0.0',
            uptime: '2 days, 4 hours',
            environment: 'Development',
            lastRestart: '2024-07-05 12:34:56'
        };

        systemContent.innerHTML = `
            <div class="bg-white rounded-lg shadow p-6 max-w-lg">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <dl class="divide-y divide-gray-200">
                    <div class="py-2 flex justify-between">
                        <dt class="font-medium text-gray-700">Version</dt>
                        <dd class="text-gray-900">${info.version}</dd>
                    </div>
                    <div class="py-2 flex justify-between">
                        <dt class="font-medium text-gray-700">Uptime</dt>
                        <dd class="text-gray-900">${info.uptime}</dd>
                    </div>
                    <div class="py-2 flex justify-between">
                        <dt class="font-medium text-gray-700">Environment</dt>
                        <dd class="text-gray-900">${info.environment}</dd>
                    </div>
                    <div class="py-2 flex justify-between">
                        <dt class="font-medium text-gray-700">Last Restart</dt>
                        <dd class="text-gray-900">${info.lastRestart}</dd>
                    </div>
                </dl>
            </div>
        `;
    }

    async exportData() {
        try {
            // Simulate data export
            const exportData = {
                pets: this.adminApp && this.adminApp.petManager && this.adminApp.petManager.users ? this.adminApp.petManager.users : [],
                users: this.adminApp && this.adminApp.userManager && this.adminApp.userManager.users ? this.adminApp.userManager.users : [],
                devices: this.adminApp && this.adminApp.notificationManager && this.adminApp.notificationManager.deviceTokens ? this.adminApp.notificationManager.deviceTokens : [],
                timestamp: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `freddy-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Data exported successfully', 'success');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Failed to export data', 'error');
            }
        }
    }

    async importData() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        console.log('Imported data:', data);
                        
                        // Simulate importing data
                        if (this.adminApp && this.adminApp.toastService) {
                            this.adminApp.toastService.show('Data imported successfully', 'success');
                        }
                    } catch (error) {
                        console.error('Error parsing imported data:', error);
                        if (this.adminApp && this.adminApp.toastService) {
                            this.adminApp.toastService.show('Invalid import file format', 'error');
                        }
                    }
                };
                reader.readAsText(file);
            };

            input.click();
        } catch (error) {
            console.error('Error importing data:', error);
            this.adminApp.toastService?.show('Failed to import data', 'error');
        }
    }

    async backupData() {
        try {
            // Simulate backup process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Backup completed successfully', 'success');
            }
            await this.loadSystemInfo(); // Refresh system info
        } catch (error) {
            console.error('Error backing up data:', error);
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Failed to backup data', 'error');
            }
        }
    }

    async clearCache() {
        try {
            if (!confirm('Are you sure you want to clear the cache? This will not affect your data.')) {
                return;
            }

            // Simulate cache clearing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Cache cleared successfully', 'success');
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Failed to clear cache', 'error');
            }
        }
    }

    async clearAllDevices() {
        try {
            if (!confirm('Are you sure you want to clear all device links? This will unlink all devices from pets.')) {
                return;
            }

            // Simulate clearing all devices
            if (this.adminApp && this.adminApp.notificationManager) {
                this.adminApp.notificationManager.deviceTokens = [];
                this.adminApp.notificationManager.renderDeviceLinks();
            }
            
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('All devices cleared successfully', 'success');
            }
        } catch (error) {
            console.error('Error clearing devices:', error);
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Failed to clear devices', 'error');
            }
        }
    }

    async resetSystem() {
        try {
            if (!confirm('Are you sure you want to reset the system? This will delete ALL data and cannot be undone!')) {
                return;
            }

            if (!confirm('This action is irreversible. Are you absolutely sure?')) {
                return;
            }

            // Simulate system reset
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('System reset completed', 'success');
            }
            
            // Reload the page to reflect reset
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error resetting system:', error);
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Failed to reset system', 'error');
            }
        }
    }
} 