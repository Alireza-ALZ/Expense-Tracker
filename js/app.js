// ============================================================================
// Main Application Module
// ============================================================================
// Orchestrates all modules: initializes Supabase, handles auth flow,
// manages transaction CRUD, and wires up all event listeners.
//
// This is the entry point loaded last in index.html.
// Requires: SupabaseClient, Auth, Transactions, UI, Utils, Jalaali, PersianDatePicker
// ============================================================================

(function () {
    'use strict';

    const { $, showToast } = Utils;

    // ========================================================================
    // Initialization
    // ========================================================================

    /**
     * Main initialization function.
     * Called when the DOM is ready.
     */
    async function init() {
        try {
            // Initialize Supabase client
            SupabaseClient.init();
        } catch (err) {
            // Show a user-friendly error if Supabase config is missing/invalid
            document.body.innerHTML = `
                <div style="max-width:600px;margin:100px auto;padding:20px;text-align:center;font-family:system-ui,sans-serif;">
                    <h1 style="color:#e74c3c;">Configuration Error</h1>
                    <p style="color:#666;line-height:1.6;">${Utils.escapeHtml(err.message)}</p>
                    <p style="color:#999;font-size:14px;margin-top:20px;">
                        See <code>config.example.js</code> for setup instructions.
                    </p>
                </div>
            `;
            return;
        }

        // Initialize theme toggle
        UI.initThemeToggle();

        // Listen for auth state changes
        Auth.onAuthStateChange(handleAuthStateChange);

        // Check for existing session
        const session = await Auth.getSession();
        if (session) {
            const user = await Auth.getCurrentUser();
            if (user) {
                await enterApp(user);
            } else {
                UI.showAuthView();
            }
        } else {
            UI.showAuthView();
        }

        // Wire up all event listeners
        bindAuthEvents();
        bindFormEvents();
        bindTransactionListEvents();
        bindMonthListEvents();
    }

    // ========================================================================
    // Auth State Handling
    // ========================================================================

    /**
     * Handles auth state changes from Supabase.
     * @param {string} event - Auth event name
     * @param {Object} session - Session object
     */
    async function handleAuthStateChange(event, session) {
        if (event === 'SIGNED_IN' && session) {
            const user = await Auth.getCurrentUser();
            if (user) {
                await enterApp(user);
            }
        } else if (event === 'SIGNED_OUT') {
            UI.showAuthView();
        }
    }

    /**
     * Enters the main app view after authentication.
     * @param {Object} user - Authenticated user object
     */
    async function enterApp(user) {
        UI.showAppView(user);
        UI.initDatePicker();
        UI.resetForm();
        await loadTransactions();
    }

    // ========================================================================
    // Auth Event Listeners
    // ========================================================================

    /**
     * Binds login/signup form events.
     */
    function bindAuthEvents() {
        // Login form submission
        const loginForm = $('#login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                UI.clearAuthErrors();

                const email = $('#login-email').value.trim();
                const password = $('#login-password').value;

                if (!email || !password) {
                    UI.showAuthError('login', 'Please enter both email and password.');
                    return;
                }

                UI.setAuthSubmitting('login', true);
                const result = await Auth.login(email, password);
                UI.setAuthSubmitting('login', false);

                if (!result.success) {
                    UI.showAuthError('login', result.error);
                }
                // Success is handled by onAuthStateChange
            });
        }

        // Signup form submission
        const signupForm = $('#signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                UI.clearAuthErrors();

                const email = $('#signup-email').value.trim();
                const password = $('#signup-password').value;
                const confirmPassword = $('#signup-confirm-password').value;

                if (!email || !password) {
                    UI.showAuthError('signup', 'Please enter both email and password.');
                    return;
                }

                if (password.length < 6) {
                    UI.showAuthError('signup', 'Password must be at least 6 characters.');
                    return;
                }

                if (password !== confirmPassword) {
                    UI.showAuthError('signup', 'Passwords do not match.');
                    return;
                }

                UI.setAuthSubmitting('signup', true);
                const result = await Auth.signUp(email, password);
                UI.setAuthSubmitting('signup', false);

                if (!result.success) {
                    UI.showAuthError('signup', result.error);
                } else if (result.autoLoggedIn) {
                    // Auto-logged in after signup
                    showToast('Account created successfully!', 'success');
                } else {
                    // Email confirmation required
                    showToast(
                        result.message || 'Account created! Please check your email to confirm.',
                        'success',
                        5000
                    );
                    UI.showLoginForm();
                }
            });
        }

        // Toggle between login and signup
        const showSignupLink = $('#show-signup');
        if (showSignupLink) {
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                UI.showSignupForm();
            });
        }

        const showLoginLink = $('#show-login');
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                UI.showLoginForm();
            });
        }

        // Logout button
        const logoutBtn = $('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const result = await Auth.logout();
                if (result.success) {
                    showToast('Logged out successfully.', 'info');
                } else {
                    showToast('Logout failed. Please try again.', 'error');
                }
            });
        }
    }

    // ========================================================================
    // Transaction Form Events
    // ========================================================================

    /**
     * Binds transaction form events.
     */
    function bindFormEvents() {
        // Type selector buttons
        const typeButtons = Utils.$$('.type-btn');
        typeButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                typeButtons.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                // Clear type error when selected
                const group = btn.closest('.form-group');
                if (group) {
                    group.classList.remove('has-error');
                    const errorEl = group.querySelector('.field-error');
                    if (errorEl) errorEl.textContent = '';
                }
            });
        });

        // Form submission
        const form = $('#transaction-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleFormSubmit();
            });
        }

        // Cancel edit button
        const cancelBtn = $('#form-cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                UI.resetForm();
            });
        }

        // Clear field errors on input
        const inputs = Utils.$$('#transaction-form input, #transaction-form textarea');
        inputs.forEach((input) => {
            input.addEventListener('input', () => {
                const group = input.closest('.form-group');
                if (group && group.classList.contains('has-error')) {
                    group.classList.remove('has-error');
                    const errorEl = group.querySelector('.field-error');
                    if (errorEl) errorEl.textContent = '';
                }
            });
        });
    }

    /**
     * Handles the transaction form submission (create or update).
     */
    async function handleFormSubmit() {
        const validation = UI.validateForm();
        if (!validation.valid) return;

        UI.setFormSubmitting(true);

        const editing = UI.getEditingTransaction();

        let result;
        if (editing) {
            // Update existing transaction
            result = await Transactions.update(editing.id, validation.data);
        } else {
            // Create new transaction
            result = await Transactions.create(validation.data);
        }

        UI.setFormSubmitting(false);

        if (result.success) {
            showToast(
                editing ? 'Transaction updated successfully!' : 'Transaction added successfully!',
                'success'
            );
            UI.resetForm();
            await loadTransactions();
        } else {
            showToast(result.error || 'Operation failed. Please try again.', 'error');
        }
    }

    // ========================================================================
    // Transaction List Events
    // ========================================================================

    /**
     * Binds click events on the transaction list (event delegation).
     */
    function bindTransactionListEvents() {
        const container = $('#transaction-list');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id;

            if (action === 'edit') {
                handleEditTransaction(id);
            } else if (action === 'delete') {
                handleDeleteTransaction(id);
            }
        });
    }

    /**
     * Handles editing a transaction.
     * @param {string} id - Transaction ID
     */
    function handleEditTransaction(id) {
        const transaction = findTransactionById(id);
        if (!transaction) {
            showToast('Transaction not found.', 'error');
            return;
        }
        UI.populateFormForEdit(transaction);
    }

    /**
     * Handles deleting a transaction.
     * @param {string} id - Transaction ID
     */
    function handleDeleteTransaction(id) {
        UI.showDeleteConfirmation(id, async () => {
            const result = await Transactions.remove(id);

            if (result.success) {
                showToast('Transaction deleted successfully!', 'success');

                // If we were editing this transaction, reset the form
                const editing = UI.getEditingTransaction();
                if (editing && editing.id === id) {
                    UI.resetForm();
                }

                await loadTransactions();
            } else {
                showToast(result.error || 'Failed to delete transaction.', 'error');
            }
        });
    }

    // ========================================================================
    // Month List Events
    // ========================================================================

    /**
     * Binds click events on the month list (event delegation).
     */
    function bindMonthListEvents() {
        const container = $('#month-list');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const monthItem = e.target.closest('.month-item');
            if (!monthItem) return;

            const jy = parseInt(monthItem.dataset.year, 10);
            const jm = parseInt(monthItem.dataset.month, 10);
            UI.selectMonth(jy, jm);
        });
    }

    // ========================================================================
    // Data Loading
    // ========================================================================

    /**
     * Loads all transactions from the database and refreshes the UI.
     */
    async function loadTransactions() {
        UI.showLoading();

        const result = await Transactions.fetchAll();

        UI.hideLoading();

        if (!result.success) {
            UI.showError(result.error || 'Failed to load transactions.');
            return;
        }

        UI.setTransactions(result.data);

        // Determine which month to select
        const currentSelected = UI.getSelectedMonth();
        if (currentSelected) {
            // Check if the currently selected month still has transactions
            const months = Transactions.getUniqueJalaliMonths(result.data);
            const stillExists = months.some(
                (m) => m.jy === currentSelected.jy && m.jm === currentSelected.jm
            );

            if (stillExists) {
                // Keep current selection
                UI.renderMonthList();
                UI.renderTransactionList();
            } else {
                // Month no longer has transactions, auto-select
                UI.renderMonthList();
                UI.autoSelectMonth();
            }
        } else {
            UI.renderMonthList();
            UI.autoSelectMonth();
        }
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    /**
     * Finds a transaction by ID from the local cache.
     * @param {string} id - Transaction ID
     * @returns {Object|undefined}
     */
    let findTransactionById = function (id) {
        return [];
    };

    // ========================================================================
    // Start the App
    // ========================================================================

    // Expose findTransactionById via a method on the allTransactions in UI
    // We need to access allTransactions from UI module
    const originalSetTransactions = UI.setTransactions;
    let _allTransactions = [];
    UI.setTransactions = function (transactions) {
        _allTransactions = transactions;
        originalSetTransactions(transactions);
    };

    // Override findTransactionById to use our local reference
    findTransactionById = function (id) {
        return _allTransactions.find((t) => t.id === id);
    };

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
