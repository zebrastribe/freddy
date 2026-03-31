// Modal Manager Component
export class ModalManager {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.init();
    }

    init() {
        this.createModalElements();
        this.setupEventListeners();
    }

    createModalElements() {
        // Create overlay
        this.overlay = document.getElementById('modalOverlay');
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'modalOverlay';
            this.overlay.className = 'modal-overlay';
            document.body.appendChild(this.overlay);
        }

        // Create modal
        this.modal = document.getElementById('modal');
        if (!this.modal) {
            this.modal = document.createElement('div');
            this.modal.id = 'modal';
            this.modal.className = 'modal';
            this.overlay.appendChild(this.modal);
        }
    }

    setupEventListeners() {
        // Close modal when clicking overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Close modal when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    show(title, content, options = {}) {
        // Update modal content
        this.modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" id="modalClose">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        `;

        // Set up close button
        const closeBtn = this.modal.querySelector('#modalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Show modal
        this.overlay.style.display = 'flex';
        
        // Focus first input if any
        setTimeout(() => {
            const firstInput = this.modal.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);

        // Add animation class
        requestAnimationFrame(() => {
            this.modal.classList.add('fade-in');
        });

        // Return promise that resolves when modal is closed
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    hide() {
        if (!this.isVisible()) return;

        // Add animation class
        this.modal.classList.add('fade-out');
        
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.modal.classList.remove('fade-in', 'fade-out');
            
            // Resolve promise if exists
            if (this.resolvePromise) {
                this.resolvePromise();
                this.resolvePromise = null;
            }
        }, 300);
    }

    isVisible() {
        return this.overlay.style.display === 'flex';
    }

    // Convenience methods for common modals
    confirm(message, title = 'Confirm') {
        return this.show(title, `
            <p>${message}</p>
            <div class="modal-actions">
                <button class="btn btn-primary" id="confirmYes">Yes</button>
                <button class="btn btn-secondary" id="confirmNo">No</button>
            </div>
        `).then(() => {
            return new Promise((resolve) => {
                document.getElementById('confirmYes').addEventListener('click', () => {
                    this.hide();
                    resolve(true);
                });
                document.getElementById('confirmNo').addEventListener('click', () => {
                    this.hide();
                    resolve(false);
                });
            });
        });
    }

    alert(message, title = 'Alert') {
        return this.show(title, `
            <p>${message}</p>
            <div class="modal-actions">
                <button class="btn btn-primary" id="alertOk">OK</button>
            </div>
        `).then(() => {
            return new Promise((resolve) => {
                document.getElementById('alertOk').addEventListener('click', () => {
                    this.hide();
                    resolve();
                });
            });
        });
    }

    prompt(message, defaultValue = '', title = 'Input') {
        return this.show(title, `
            <p>${message}</p>
            <div class="form-group">
                <input type="text" id="promptInput" class="form-control" value="${defaultValue}" placeholder="Enter value...">
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" id="promptOk">OK</button>
                <button class="btn btn-secondary" id="promptCancel">Cancel</button>
            </div>
        `).then(() => {
            return new Promise((resolve) => {
                const input = document.getElementById('promptInput');
                
                document.getElementById('promptOk').addEventListener('click', () => {
                    this.hide();
                    resolve(input.value);
                });
                
                document.getElementById('promptCancel').addEventListener('click', () => {
                    this.hide();
                    resolve(null);
                });
                
                // Allow Enter to submit
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('promptOk').click();
                    }
                });
            });
        });
    }

    // Form modal
    form(title, fields, submitText = 'Submit') {
        const formHtml = `
            <form id="modalForm">
                ${fields.map(field => `
                    <div class="form-group">
                        <label for="${field.name}">${field.label}</label>
                        ${this.renderFormField(field)}
                    </div>
                `).join('')}
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">${submitText}</button>
                    <button type="button" class="btn btn-secondary" id="formCancel">Cancel</button>
                </div>
            </form>
        `;

        return this.show(title, formHtml).then(() => {
            return new Promise((resolve) => {
                const form = document.getElementById('modalForm');
                
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const formData = {};
                    fields.forEach(field => {
                        const element = form.querySelector(`[name="${field.name}"]`);
                        if (element) {
                            formData[field.name] = element.value;
                        }
                    });
                    this.hide();
                    resolve(formData);
                });
                
                document.getElementById('formCancel').addEventListener('click', () => {
                    this.hide();
                    resolve(null);
                });
            });
        });
    }

    renderFormField(field) {
        switch (field.type) {
            case 'textarea':
                return `<textarea name="${field.name}" class="form-control" ${field.required ? 'required' : ''}>${field.value || ''}</textarea>`;
            case 'select':
                return `
                    <select name="${field.name}" class="form-control" ${field.required ? 'required' : ''}>
                        ${field.options.map(option => `
                            <option value="${option.value}" ${option.value === field.value ? 'selected' : ''}>
                                ${option.label}
                            </option>
                        `).join('')}
                    </select>
                `;
            case 'checkbox':
                return `<input type="checkbox" name="${field.name}" class="form-control" ${field.value ? 'checked' : ''}>`;
            default:
                return `<input type="${field.type || 'text'}" name="${field.name}" class="form-control" value="${field.value || ''}" ${field.required ? 'required' : ''}>`;
        }
    }
} 