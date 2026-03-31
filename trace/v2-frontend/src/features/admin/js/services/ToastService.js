export class ToastService {
    constructor() {
        this.container = null;
        this.toastId = 0;
    }

    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            console.error('Toast container not found');
        }
    }

    show(message, type = 'info', duration = 5000) {
        if (!this.container) {
            console.error('Toast container not available');
            return;
        }

        const toastId = `toast-${++this.toastId}`;
        const toast = this.createToast(message, type, toastId);
        
        this.container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-x-full');
        }, 10);

        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(toastId);
        }, duration);

        return toastId;
    }

    createToast(message, type, id) {
        const typeClasses = {
            success: 'bg-green-100 border-green-300 text-green-800',
            error: 'bg-red-100 border-red-300 text-red-800',
            warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
            info: 'bg-blue-100 border-blue-300 text-blue-800'
        };

        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.id = id;
        toast.className = `max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border-l-4 ${typeClasses[type]} opacity-0 translate-x-full transition-all duration-300 ease-in-out`;
        
        toast.innerHTML = `
            <div class="p-4">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <span class="text-lg">${iconMap[type]}</span>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm font-medium">${message}</p>
                    </div>
                    <div class="ml-4 flex-shrink-0 flex">
                        <button class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150" onclick="window.adminApp.toastService.removeToast('${id}')">
                            <span class="sr-only">Close</span>
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        return toast;
    }

    removeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
} 