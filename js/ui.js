// ============================================================================
// UI Manager & Presentation Layer (Class-based)
// ============================================================================
// Encapsulates all DOM manipulation, rendering, form validation, modals,
// and user interface state management.
//
// Requires: Utils, Jalaali, PersianDatePicker, Transactions
// ============================================================================

(function () {
    'use strict';

    class UIManager {
        #allTransactions;
        #selectedMonth;
        #editingTransaction;
        #datePicker;
        #isLoading;
        #isSubmitting;
        #transactionsService;
        #jalaali;

        constructor(transactionsService = window.Transactions, jalaaliLib = window.Jalaali) {
            this.#transactionsService = transactionsService;
            this.#jalaali = jalaaliLib;
            this.#allTransactions = [];
            this.#selectedMonth = null;
            this.#editingTransaction = null;
            this.#datePicker = null;
            this.#isLoading = false;
            this.#isSubmitting = false;
        }

        // ====================================================================
        // Getters & Setters
        // ====================================================================

        get transactions() {
            return this.#allTransactions;
        }

        get selectedMonth() {
            return this.#selectedMonth;
        }

        get editingTransaction() {
            return this.#editingTransaction;
        }

        get datePicker() {
            return this.#datePicker;
        }

        setTransactions(transactions) {
            this.#allTransactions = transactions;
        }

        getEditingTransaction() {
            return this.#editingTransaction;
        }

        getSelectedMonth() {
            return this.#selectedMonth;
        }

        // ====================================================================
        // Authentication UI
        // ====================================================================

        /**
         * Shows the authentication view (login/signup).
         */
        showAuthView() {
            const { $ } = Utils;
            $('#auth-section').classList.remove('hidden');
            $('#app-section').classList.add('hidden');

            // Hide user info in header
            const userInfo = $('#user-info');
            if (userInfo) userInfo.classList.add('hidden');

            this.showLoginForm();
        }

        /**
         * Shows the main app view.
         * @param {Object} user - The authenticated user object
         */
        showAppView(user) {
            const { $ } = Utils;
            $('#auth-section').classList.add('hidden');
            $('#app-section').classList.remove('hidden');

            // Show user info in header
            const userInfo = $('#user-info');
            if (userInfo) userInfo.classList.remove('hidden');

            // Display user email in header
            const userEmail = $('#user-email');
            if (userEmail) {
                userEmail.textContent = user.email;
            }
        }

        /**
         * Shows the login form and hides signup.
         */
        showLoginForm() {
            const { $ } = Utils;
            $('#login-form-container').classList.remove('hidden');
            $('#signup-form-container').classList.add('hidden');
            this.clearAuthErrors();
            this.clearAuthForms();
        }

        /**
         * Shows the signup form and hides login.
         */
        showSignupForm() {
            const { $ } = Utils;
            $('#login-form-container').classList.add('hidden');
            $('#signup-form-container').classList.remove('hidden');
            this.clearAuthErrors();
            this.clearAuthForms();
        }

        /**
         * Clears all auth error messages.
         */
        clearAuthErrors() {
            const { $$ } = Utils;
            $$('.auth-error').forEach((el) => {
                el.textContent = '';
                el.classList.add('hidden');
            });
        }

        /**
         * Clears auth form inputs.
         */
        clearAuthForms() {
            const { $$ } = Utils;
            $$('#auth-section input').forEach((input) => {
                input.value = '';
            });
        }

        /**
         * Displays an auth error message.
         * @param {string} formId - 'login' or 'signup'
         * @param {string} message - Error message
         */
        showAuthError(formId, message) {
            const { $ } = Utils;
            const errorEl = $(`#${formId}-error`);
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.classList.remove('hidden');
            }
        }

        /**
         * Sets the submitting state on auth buttons.
         * @param {string} formId - 'login' or 'signup'
         * @param {boolean} submitting
         */
        setAuthSubmitting(formId, submitting) {
            const { $ } = Utils;
            const btn = $(`#${formId}-btn`);
            if (btn) {
                btn.disabled = submitting;
                btn.textContent = submitting
                    ? 'Please wait...'
                    : formId === 'login'
                    ? 'Login'
                    : 'Sign Up';
            }
        }

        // ====================================================================
        // Transaction Form UI
        // ====================================================================

        /**
         * Initializes the date picker on the date input field.
         */
        initDatePicker() {
            const { $ } = Utils;
            const dateInput = $('#transaction-date');
            if (!dateInput || this.#datePicker) return;

            this.#datePicker = new PersianDatePicker({
                inputElement: dateInput,
                onSelect: () => {
                    // Clear any date validation error when a date is selected
                    this.clearFieldError('transaction-date');
                }
            });
        }

        /**
         * Resets the transaction form to "Add" mode.
         */
        resetForm() {
            const { $, $$ } = Utils;
            const form = $('#transaction-form');
            if (!form) return;

            form.reset();
            this.#editingTransaction = null;

            // Reset date picker
            if (this.#datePicker) {
                this.#datePicker.clear();
            }

            // Update form UI to "Add" mode
            $('#form-title').textContent = 'Add Transaction';
            $('#form-submit-btn').textContent = 'Add Transaction';
            $('#form-cancel-btn').classList.add('hidden');

            // Clear all validation errors
            this.clearAllFieldErrors();

            // Reset type buttons
            $$('.type-btn').forEach((btn) => btn.classList.remove('active'));
        }

        /**
         * Populates the form with a transaction for editing.
         * @param {Object} transaction - The transaction to edit
         */
        populateFormForEdit(transaction) {
            const { $, $$ } = Utils;
            this.#editingTransaction = transaction;

            // Set form values
            $('#transaction-title').value = transaction.title;
            $('#transaction-description').value = transaction.description || '';
            $('#transaction-amount').value = transaction.amount;

            // Set type buttons
            $$('.type-btn').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.type === transaction.type);
            });

            // Set date picker from Gregorian date
            if (this.#datePicker) {
                this.#datePicker.setFromGregorian(transaction.date);
            }

            // Update form UI to "Edit" mode
            $('#form-title').textContent = 'Edit Transaction';
            $('#form-submit-btn').textContent = 'Update Transaction';
            $('#form-cancel-btn').classList.remove('hidden');

            // Scroll to form
            $('#transaction-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        /**
         * Gets the currently selected transaction type.
         * @returns {string|null} 'income', 'expense', or null
         */
        getSelectedType() {
            const { $ } = Utils;
            const active = $('.type-btn.active');
            return active ? active.dataset.type : null;
        }

        /**
         * Validates the transaction form.
         * @returns {{ valid: boolean, data?: Object, errors?: string[] }}
         */
        validateForm() {
            const { $ } = Utils;
            let hasFieldError = false;

            // Clear previous errors
            this.clearAllFieldErrors();

            // Title
            const title = $('#transaction-title').value.trim();
            if (!title) {
                this.showFieldError('transaction-title', 'Title is required.');
                hasFieldError = true;
            }

            // Amount
            const amountRaw = $('#transaction-amount').value;
            const amount = Utils.parseNumber(amountRaw);
            if (!amountRaw.trim()) {
                this.showFieldError('transaction-amount', 'Amount is required.');
                hasFieldError = true;
            } else if (isNaN(amount) || amount <= 0) {
                this.showFieldError('transaction-amount', 'Amount must be a valid positive number.');
                hasFieldError = true;
            } else if (!Number.isInteger(amount)) {
                this.showFieldError('transaction-amount', 'Amount must be a whole number (no decimals).');
                hasFieldError = true;
            }

            // Type
            const type = this.getSelectedType();
            if (!type) {
                this.showFieldError('type-selector', 'Please select a transaction type.');
                hasFieldError = true;
            }

            // Date
            const dateValue = this.#datePicker ? this.#datePicker.getValue() : '';
            if (!dateValue) {
                this.showFieldError('transaction-date', 'Please select a date.');
                hasFieldError = true;
            }

            if (hasFieldError) {
                return { valid: false };
            }

            const description = $('#transaction-description').value.trim();

            return {
                valid: true,
                data: {
                    title,
                    description,
                    amount,
                    type,
                    date: dateValue
                }
            };
        }

        /**
         * Shows a validation error for a specific field.
         * @param {string} fieldId - The input field ID
         * @param {string} message - Error message
         */
        showFieldError(fieldId, message) {
            const { $, createElement } = Utils;
            const field = $(`#${fieldId}`);
            if (!field) return;

            // Add error class to the field
            const group = field.closest('.form-group') || field.parentElement;
            if (group) {
                group.classList.add('has-error');
            }

            // Find or create error message element
            let errorEl = group ? group.querySelector('.field-error') : null;
            if (!errorEl && group) {
                errorEl = createElement('span', { className: 'field-error' });
                group.appendChild(errorEl);
            }
            if (errorEl) {
                errorEl.textContent = message;
            }
        }

        /**
         * Clears the error for a specific field.
         * @param {string} fieldId - The input field ID
         */
        clearFieldError(fieldId) {
            const { $ } = Utils;
            const field = $(`#${fieldId}`);
            if (!field) return;

            const group = field.closest('.form-group') || field.parentElement;
            if (group) {
                group.classList.remove('has-error');
                const errorEl = group.querySelector('.field-error');
                if (errorEl) errorEl.textContent = '';
            }
        }

        /**
         * Clears all field validation errors.
         */
        clearAllFieldErrors() {
            const { $$ } = Utils;
            $$('.form-group').forEach((group) => {
                group.classList.remove('has-error');
                const errorEl = group.querySelector('.field-error');
                if (errorEl) errorEl.textContent = '';
            });
        }

        /**
         * Sets the submitting state on the form.
         * @param {boolean} submitting
         */
        setFormSubmitting(submitting) {
            const { $, $$ } = Utils;
            this.#isSubmitting = submitting;
            const btn = $('#form-submit-btn');
            const cancelBtn = $('#form-cancel-btn');

            if (btn) {
                btn.disabled = submitting;
                if (submitting) {
                    btn.textContent = this.#editingTransaction ? 'Updating...' : 'Adding...';
                } else {
                    btn.textContent = this.#editingTransaction ? 'Update Transaction' : 'Add Transaction';
                }
            }

            if (cancelBtn) {
                cancelBtn.disabled = submitting;
            }

            // Disable all form inputs during submission
            $$('#transaction-form input, #transaction-form textarea, #transaction-form button').forEach(
                (el) => {
                    if (el !== btn && el !== cancelBtn) {
                        el.disabled = submitting;
                    }
                }
            );
        }

        // ====================================================================
        // Summary Cards
        // ====================================================================

        /**
         * Updates the balance, income, and expense summary cards.
         * @param {{ income: number, expense: number, balance: number }} totals
         */
        updateSummary(totals) {
            const { $, formatAmount } = Utils;

            // Balance
            const balanceEl = $('#balance-amount');
            if (balanceEl) {
                balanceEl.textContent = formatAmount(totals.balance);
                balanceEl.className = 'summary-amount';
                if (totals.balance > 0) balanceEl.classList.add('positive');
                else if (totals.balance < 0) balanceEl.classList.add('negative');
            }

            // Income
            const incomeEl = $('#income-amount');
            if (incomeEl) {
                incomeEl.textContent = formatAmount(totals.income);
            }

            // Expense
            const expenseEl = $('#expense-amount');
            if (expenseEl) {
                expenseEl.textContent = formatAmount(totals.expense);
            }
        }

        // ====================================================================
        // Transaction List Rendering
        // ====================================================================

        /**
         * Renders the transaction list for the currently selected month.
         * Transactions are ordered by date desc, then created_at desc.
         */
        renderTransactionList() {
            const { $ } = Utils;
            const container = $('#transaction-list');
            if (!container) return;

            const transactionsService = this.#transactionsService || window.Transactions;
            const jalaali = this.#jalaali || window.Jalaali;

            // Filter by selected month
            let filtered = [];
            if (this.#selectedMonth) {
                filtered = transactionsService.filterByJalaliMonth(
                    this.#allTransactions,
                    this.#selectedMonth.jy,
                    this.#selectedMonth.jm
                );
            }

            // Sort: date desc, then created_at desc
            filtered.sort((a, b) => {
                if (a.date !== b.date) return b.date.localeCompare(a.date);
                return new Date(b.created_at) - new Date(a.created_at);
            });

            // Update summary for filtered transactions
            const totals = transactionsService.calculateTotals(filtered);
            this.updateSummary(totals);

            // Clear container
            container.innerHTML = '';

            // Empty state
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state__icon">📋</div>
                        <p class="empty-state__text">No transactions for this month.</p>
                        <p class="empty-state__subtext">Add your first transaction using the form above.</p>
                    </div>
                `;
                return;
            }

            // Group transactions by Jalali date for visual grouping
            const groups = new Map();
            for (const t of filtered) {
                const j = jalaali.gregorianStringToJalaali(t.date);
                const dateKey = jalaali.formatJalaali(j.jy, j.jm, j.jd);
                const dateLabel = jalaali.formatJalaaliPersian(j.jy, j.jm, j.jd);

                if (!groups.has(dateKey)) {
                    groups.set(dateKey, { label: dateLabel, transactions: [] });
                }
                groups.get(dateKey).transactions.push(t);
            }

            // Render each group
            for (const [, group] of groups) {
                // Date header
                const dateHeader = Utils.createElement(
                    'div',
                    { className: 'transaction-date-header' },
                    group.label
                );
                container.appendChild(dateHeader);

                // Transaction items
                for (const t of group.transactions) {
                    container.appendChild(this.createTransactionItem(t));
                }
            }
        }

        /**
         * Creates a transaction list item DOM element.
         * @param {Object} t - Transaction object
         * @returns {Element}
         */
        createTransactionItem(t) {
            const { createElement, formatAmount } = Utils;
            const isIncome = t.type === 'income';
            const sign = isIncome ? '+' : '-';
            const typeClass = isIncome ? 'transaction--income' : 'transaction--expense';

            const item = createElement('div', {
                className: `transaction-item ${typeClass}`,
                dataset: { id: t.id }
            });

            // Left side: indicator + info
            const left = createElement('div', { className: 'transaction-item__left' });

            const indicator = createElement('div', {
                className: `transaction-item__indicator ${typeClass}`
            });

            const info = createElement('div', { className: 'transaction-item__info' });
            const title = createElement(
                'span',
                { className: 'transaction-item__title' },
                t.title
            );
            info.appendChild(title);

            if (t.description) {
                const desc = createElement(
                    'span',
                    { className: 'transaction-item__desc' },
                    t.description
                );
                info.appendChild(desc);
            }

            left.appendChild(indicator);
            left.appendChild(info);

            // Right side: amount + actions
            const right = createElement('div', { className: 'transaction-item__right' });

            const amount = createElement(
                'span',
                { className: `transaction-item__amount ${typeClass}` },
                `${sign}${formatAmount(t.amount)}`
            );

            const actions = createElement('div', { className: 'transaction-item__actions' });

            const editBtn = createElement('button', {
                className: 'btn-icon btn-icon--edit',
                title: 'Edit',
                'aria-label': 'Edit transaction',
                dataset: { action: 'edit', id: t.id }
            });
            editBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

            const deleteBtn = createElement('button', {
                className: 'btn-icon btn-icon--delete',
                title: 'Delete',
                'aria-label': 'Delete transaction',
                dataset: { action: 'delete', id: t.id }
            });
            deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            right.appendChild(amount);
            right.appendChild(actions);

            item.appendChild(left);
            item.appendChild(right);

            return item;
        }

        // ====================================================================
        // Month List Rendering
        // ====================================================================

        /**
         * Renders the list of Shamsi months that have transactions.
         */
        renderMonthList() {
            const { $, createElement } = Utils;
            const container = $('#month-list');
            if (!container) return;

            const transactionsService = this.#transactionsService || window.Transactions;
            const jalaali = this.#jalaali || window.Jalaali;
            const months = transactionsService.getUniqueJalaliMonths(this.#allTransactions);

            container.innerHTML = '';

            // Empty state
            if (months.length === 0) {
                container.innerHTML = `
                    <div class="empty-state empty-state--small">
                        <p class="empty-state__text">No transaction months yet.</p>
                    </div>
                `;
                return;
            }

            for (const m of months) {
                const isSelected =
                    this.#selectedMonth &&
                    this.#selectedMonth.jy === m.jy &&
                    this.#selectedMonth.jm === m.jm;

                const btn = createElement('button', {
                    className: `month-item ${isSelected ? 'month-item--selected' : ''}`,
                    dataset: { year: m.jy, month: m.jm }
                });

                btn.innerHTML = `
                    <span class="month-item__name">${jalaali.getMonthName(m.jm)}</span>
                    <span class="month-item__year">${m.jy}</span>
                `;

                container.appendChild(btn);
            }
        }

        /**
         * Selects a month and updates the display.
         * @param {number} jy - Jalaali year
         * @param {number} jm - Jalaali month
         */
        selectMonth(jy, jm) {
            this.#selectedMonth = { jy, jm };
            this.renderMonthList();
            this.renderTransactionList();
        }

        /**
         * Auto-selects the current Shamsi month, or the first available month
         * if the current month has no transactions.
         */
        autoSelectMonth() {
            const jalaali = this.#jalaali || window.Jalaali;
            const transactionsService = this.#transactionsService || window.Transactions;
            const today = jalaali.todayJalaali();
            const months = transactionsService.getUniqueJalaliMonths(this.#allTransactions);

            // Check if current month has transactions
            const currentMonthExists = months.some(
                (m) => m.jy === today.jy && m.jm === today.jm
            );

            if (currentMonthExists) {
                this.selectMonth(today.jy, today.jm);
            } else if (months.length > 0) {
                // Select the most recent month with transactions
                this.selectMonth(months[0].jy, months[0].jm);
            } else {
                // No transactions at all — show current month (empty state)
                this.selectMonth(today.jy, today.jm);
            }
        }

        // ====================================================================
        // Loading & Error States
        // ====================================================================

        /**
         * Shows the loading spinner.
         */
        showLoading() {
            this.#isLoading = true;
            const { $ } = Utils;
            const loader = $('#loading-state');
            const content = $('#content-area');
            if (loader) loader.classList.remove('hidden');
            if (content) content.classList.add('hidden');
        }

        /**
         * Hides the loading spinner.
         */
        hideLoading() {
            this.#isLoading = false;
            const { $ } = Utils;
            const loader = $('#loading-state');
            const content = $('#content-area');
            if (loader) loader.classList.add('hidden');
            if (content) content.classList.remove('hidden');
        }

        /**
         * Shows a fatal error state (e.g., failed to load initial data).
         * @param {string} message
         */
        showError(message) {
            const { $, escapeHtml, createElement } = Utils;
            const container = $('#transaction-list');
            if (!container) return;

            container.innerHTML = `
                <div class="error-state">
                    <div class="error-state__icon">⚠</div>
                    <p class="error-state__text">${escapeHtml(message)}</p>
                </div>
            `;

            // Create retry button with addEventListener (no inline handler)
            const retryBtn = createElement('button', {
                className: 'btn btn--primary'
            }, 'Retry');
            retryBtn.addEventListener('click', () => location.reload());

            const errorDiv = container.querySelector('.error-state');
            if (errorDiv) {
                errorDiv.appendChild(retryBtn);
            }
        }

        // ====================================================================
        // Delete Confirmation Modal
        // ====================================================================

        /**
         * Shows a confirmation dialog before deleting a transaction.
         * @param {string} transactionId - The transaction ID to delete
         * @param {Function} onConfirm - Async callback if user confirms
         */
        showDeleteConfirmation(transactionId, onConfirm) {
            const { $, createElement } = Utils;

            // Create overlay
            const overlay = createElement('div', { className: 'modal-overlay' });
            const modal = createElement('div', { className: 'modal' });

            modal.innerHTML = `
                <div class="modal__header">
                    <h3 class="modal__title">Delete Transaction</h3>
                </div>
                <div class="modal__body">
                    <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
                </div>
                <div class="modal__footer">
                    <button class="btn btn--secondary" id="modal-cancel-btn">Cancel</button>
                    <button class="btn btn--danger" id="modal-confirm-btn">Delete</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Animate in
            requestAnimationFrame(() => {
                overlay.classList.add('modal-overlay--visible');
            });

            // Close function
            const close = () => {
                overlay.classList.remove('modal-overlay--visible');
                overlay.addEventListener('transitionend', () => overlay.remove());
            };

            // Event listeners
            $('#modal-cancel-btn', overlay).addEventListener('click', close);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close();
            });

            $('#modal-confirm-btn', overlay).addEventListener('click', async () => {
                const confirmBtn = $('#modal-confirm-btn', overlay);
                const cancelBtn = $('#modal-cancel-btn', overlay);
                confirmBtn.disabled = true;
                cancelBtn.disabled = true;
                confirmBtn.textContent = 'Deleting...';

                await onConfirm();
                close();
            });
        }

        // ====================================================================
        // Theme Management
        // ====================================================================

        /**
         * Initializes the dark mode toggle.
         */
        initThemeToggle() {
            const { $ } = Utils;
            const toggle = $('#theme-toggle');
            if (!toggle) return;

            // Check for saved preference
            const savedTheme = localStorage.getItem('expense-tracker-theme');
            if (savedTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                toggle.setAttribute('aria-pressed', 'true');
            }

            toggle.addEventListener('click', () => {
                const isDark =
                    document.documentElement.getAttribute('data-theme') === 'dark';

                if (isDark) {
                    document.documentElement.removeAttribute('data-theme');
                    localStorage.setItem('expense-tracker-theme', 'light');
                    toggle.setAttribute('aria-pressed', 'false');
                } else {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    localStorage.setItem('expense-tracker-theme', 'dark');
                    toggle.setAttribute('aria-pressed', 'true');
                }
            });
        }
    }

    // Export class and singleton instance
    window.UIManager = UIManager;
    window.UI = new UIManager();
})();
