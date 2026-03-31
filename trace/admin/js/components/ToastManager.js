// Toast Manager Component
export class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Auto remove after duration
        setTimeout(() => {
            this.remove(toast);
        }, duration);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('fade-in');
        });

        return toast;
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getIconForType(type);
        
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-icon">${icon}</span>
                <span class="toast-title">${this.getTitleForType(type)}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="toast-message">${message}</div>
        `;

        return toast;
    }

    getIconForType(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            danger: '❌',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    getTitleForType(type) {
        const titles = {
            success: 'Success',
            warning: 'Warning',
            danger: 'Error',
            info: 'Info'
        };
        return titles[type] || titles.info;
    }

    remove(toast) {
        if (toast && toast.parentNode) {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                const index = this.toasts.indexOf(toast);
                if (index > -1) {
                    this.toasts.splice(index, 1);
                }
            }, 300);
        }
    }

    clear() {
        this.toasts.forEach(toast => {
            this.remove(toast);
        });
    }

    // Convenience methods
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    danger(message, duration) {
        return this.show(message, 'danger', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
} 