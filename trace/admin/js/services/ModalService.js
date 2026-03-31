export class ModalService {
    constructor() {
        this.modalOverlay = null;
        this.modal = null;
        this.modalTitle = null;
        this.modalBody = null;
        this.modalClose = null;
    }

    init() {
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modal = this.modalOverlay?.querySelector('.bg-white');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.modalClose = document.getElementById('modalClose');

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal on overlay click
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.modalOverlay) {
                    this.hide();
                }
            });
        }

        // Close modal on close button click
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => {
                this.hide();
            });
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    show(title, bodyHtml) {
        console.log('[ModalService] show() called with title:', title);
        const overlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        if (!overlay || !modalTitle || !modalBody) {
            console.error('[ModalService] Modal elements not found!');
            return;
        }
        overlay.classList.remove('hidden');
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHtml;
        
        // Focus first input in modal
        setTimeout(() => {
            const firstInput = this.modalBody.querySelector('input, button');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    hide() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) overlay.classList.add('hidden');
    }

    isVisible() {
        return this.modalOverlay && !this.modalOverlay.classList.contains('hidden');
    }
} 