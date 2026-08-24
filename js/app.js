// ============================================================================
// Main Application Module (ES Module Class)
// ============================================================================
// Orchestrates all modules: initializes Supabase, handles auth flow,
// manages transaction CRUD, and wires up all event listeners.
//
// This is the entry point loaded via <script type="module" src="js/app.js">.
// Requires: SupabaseClient, Auth, Transactions, UI, Utils
// ============================================================================

import { $, $$, showToast, escapeHtml } from "./utils.js";
import { SupabaseClient } from "./supabase.js";
import { Auth } from "./auth.js";
import { Transactions } from "./transactions.js";
import { UI } from "./ui.js";

export class ExpenseTrackerApp {
  #supabaseClient;
  #authService;
  #transactionsService;
  #uiManager;
  #currentUser;

  /**
   * @param {Object} [dependencies]
   * @param {SupabaseClientService} [dependencies.supabaseClient]
   * @param {AuthService} [dependencies.authService]
   * @param {TransactionService} [dependencies.transactionsService]
   * @param {UIManager} [dependencies.uiManager]
   */
  constructor(dependencies = {}) {
    this.#supabaseClient = dependencies.supabaseClient || SupabaseClient;
    this.#authService = dependencies.authService || Auth;
    this.#transactionsService =
      dependencies.transactionsService || Transactions;
    this.#uiManager = dependencies.uiManager || UI;
    this.#currentUser = null;
  }

  // ====================================================================
  // Initialization
  // ====================================================================

  /**
   * Main initialization method.
   * Called when the DOM is ready.
   */
  async init() {
    try {
      // Initialize Supabase client
      this.#supabaseClient.init();
    } catch (err) {
      // Show a user-friendly error if Supabase config is missing/invalid
      document.body.innerHTML = `
                <div style="max-width:600px;margin:100px auto;padding:20px;text-align:center;font-family:system-ui,sans-serif;">
                    <h1 style="color:#e74c3c;">Configuration Error</h1>
                    <p style="color:#666;line-height:1.6;">${escapeHtml(err.message)}</p>
                    <p style="color:#999;font-size:14px;margin-top:20px;">
                        See <code>config.example.js</code> for setup instructions.
                    </p>
                </div>
            `;
      return;
    }

    // Initialize theme toggle
    this.#uiManager.initThemeToggle();

    // Listen for auth state changes
    this.#authService.onAuthStateChange((event, session) => {
      this.#handleAuthStateChange(event, session);
    });

    // Check for existing session
    const session = await this.#authService.getSession();
    if (session) {
      const user = await this.#authService.getCurrentUser();
      if (user) {
        await this.#enterApp(user);
      } else {
        this.#uiManager.showAuthView();
      }
    } else {
      this.#uiManager.showAuthView();
    }

    // Wire up all event listeners
    this.#bindAuthEvents();
    this.#bindFormEvents();
    this.#bindTransactionListEvents();
    this.#bindMonthListEvents();
  }

  // ====================================================================
  // Auth State Handling
  // ====================================================================

  /**
   * Handles auth state changes from Supabase.
   * @param {string} event - Auth event name
   * @param {Object} session - Session object
   * @private
   */
  async #handleAuthStateChange(event, session) {
    if (event === "SIGNED_IN" && session) {
      const user = await this.#authService.getCurrentUser();
      if (user) {
        await this.#enterApp(user);
      }
    } else if (event === "SIGNED_OUT") {
      this.#currentUser = null;
      this.#uiManager.showAuthView();
    }
  }

  /**
   * Enters the main app view after authentication.
   * @param {Object} user - Authenticated user object
   * @private
   */
  async #enterApp(user) {
    this.#currentUser = user;
    this.#uiManager.showAppView(user);
    this.#uiManager.initDatePicker();
    this.#uiManager.resetForm();
    await this.#loadTransactions();
  }

  // ====================================================================
  // Auth Event Listeners
  // ====================================================================

  /**
   * Binds login/signup form events.
   * @private
   */
  #bindAuthEvents() {
    // Login form submission
    const loginForm = $("#login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        this.#uiManager.clearAuthErrors();

        const email = $("#login-email").value.trim();
        const password = $("#login-password").value;

        if (!email || !password) {
          this.#uiManager.showAuthError(
            "login",
            "Please enter both email and password.",
          );
          return;
        }

        this.#uiManager.setAuthSubmitting("login", true);
        const result = await this.#authService.login(email, password);
        this.#uiManager.setAuthSubmitting("login", false);

        if (!result.success) {
          this.#uiManager.showAuthError("login", result.error);
        }
        // Success is handled by onAuthStateChange
      });
    }

    // Signup form submission
    const signupForm = $("#signup-form");
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        this.#uiManager.clearAuthErrors();

        const email = $("#signup-email").value.trim();
        const password = $("#signup-password").value;
        const confirmPassword = $("#signup-confirm-password").value;

        if (!email || !password) {
          this.#uiManager.showAuthError(
            "signup",
            "Please enter both email and password.",
          );
          return;
        }

        if (password.length < 6) {
          this.#uiManager.showAuthError(
            "signup",
            "Password must be at least 6 characters.",
          );
          return;
        }

        if (password !== confirmPassword) {
          this.#uiManager.showAuthError("signup", "Passwords do not match.");
          return;
        }

        this.#uiManager.setAuthSubmitting("signup", true);
        const result = await this.#authService.signUp(email, password);
        this.#uiManager.setAuthSubmitting("signup", false);

        if (!result.success) {
          this.#uiManager.showAuthError("signup", result.error);
        } else if (result.autoLoggedIn) {
          // Auto-logged in after signup
          showToast("Account created successfully!", "success");
        } else {
          // Email confirmation required
          showToast(
            result.message ||
              "Account created! Please check your email to confirm.",
            "success",
            5000,
          );
          this.#uiManager.showLoginForm();
        }
      });
    }

    // Toggle between login and signup
    const showSignupLink = $("#show-signup");
    if (showSignupLink) {
      showSignupLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.#uiManager.showSignupForm();
      });
    }

    const showLoginLink = $("#show-login");
    if (showLoginLink) {
      showLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.#uiManager.showLoginForm();
      });
    }

    // Logout button
    const logoutBtn = $("#logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        const result = await this.#authService.logout();
        if (result.success) {
          showToast("Logged out successfully.", "info");
        } else {
          showToast("Logout failed. Please try again.", "error");
        }
      });
    }
  }

  // ====================================================================
  // Transaction Form Events
  // ====================================================================

  /**
   * Binds transaction form events.
   * @private
   */
  #bindFormEvents() {
    // Type selector buttons
    const typeButtons = $$(".type-btn");
    typeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        typeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Clear type error when selected
        const group = btn.closest(".form-group");
        if (group) {
          group.classList.remove("has-error");
          const errorEl = group.querySelector(".field-error");
          if (errorEl) errorEl.textContent = "";
        }
      });
    });

    // Form submission
    const form = $("#transaction-form");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.#handleFormSubmit();
      });
    }

    // Cancel edit button
    const cancelBtn = $("#form-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.#uiManager.resetForm();
      });
    }

    // Clear field errors on input
    const inputs = $$("#transaction-form input, #transaction-form textarea");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        const group = input.closest(".form-group");
        if (group && group.classList.contains("has-error")) {
          group.classList.remove("has-error");
          const errorEl = group.querySelector(".field-error");
          if (errorEl) errorEl.textContent = "";
        }
      });
    });
  }

  /**
   * Handles the transaction form submission (create or update).
   * @private
   */
  async #handleFormSubmit() {
    const validation = this.#uiManager.validateForm();
    if (!validation.valid) return;

    this.#uiManager.setFormSubmitting(true);

    const editing = this.#uiManager.getEditingTransaction();

    let result;
    if (editing) {
      // Update existing transaction
      result = await this.#transactionsService.update(
        editing.id,
        validation.data,
      );
    } else {
      // Create new transaction
      result = await this.#transactionsService.create(validation.data);
    }

    this.#uiManager.setFormSubmitting(false);

    if (result.success) {
      showToast(
        editing
          ? "Transaction updated successfully!"
          : "Transaction added successfully!",
        "success",
      );
      this.#uiManager.resetForm();
      await this.#loadTransactions();
    } else {
      showToast(result.error || "Operation failed. Please try again.", "error");
    }
  }

  // ====================================================================
  // Transaction List Events
  // ====================================================================

  /**
   * Binds click events on the transaction list (event delegation).
   * @private
   */
  #bindTransactionListEvents() {
    const container = $("#transaction-list");
    if (!container) return;

    container.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-action]");
      if (!actionBtn) return;

      const action = actionBtn.dataset.action;
      const id = actionBtn.dataset.id;

      if (action === "edit") {
        this.#handleEditTransaction(id);
      } else if (action === "delete") {
        this.#handleDeleteTransaction(id);
      }
    });
  }

  /**
   * Handles editing a transaction.
   * @param {string} id - Transaction ID
   * @private
   */
  #handleEditTransaction(id) {
    const transaction = this.#findTransactionById(id);
    if (!transaction) {
      showToast("Transaction not found.", "error");
      return;
    }
    this.#uiManager.populateFormForEdit(transaction);
  }

  /**
   * Handles deleting a transaction.
   * @param {string} id - Transaction ID
   * @private
   */
  #handleDeleteTransaction(id) {
    this.#uiManager.showDeleteConfirmation(id, async () => {
      const result = await this.#transactionsService.remove(id);

      if (result.success) {
        showToast("Transaction deleted successfully!", "success");

        // If we were editing this transaction, reset the form
        const editing = this.#uiManager.getEditingTransaction();
        if (editing && editing.id === id) {
          this.#uiManager.resetForm();
        }

        await this.#loadTransactions();
      } else {
        showToast(result.error || "Failed to delete transaction.", "error");
      }
    });
  }

  // ====================================================================
  // Month List Events
  // ====================================================================

  /**
   * Binds click events on the month list (event delegation).
   * @private
   */
  #bindMonthListEvents() {
    const container = $("#month-list");
    if (!container) return;

    container.addEventListener("click", (e) => {
      const monthItem = e.target.closest(".month-item");
      if (!monthItem) return;

      const jy = parseInt(monthItem.dataset.year, 10);
      const jm = parseInt(monthItem.dataset.month, 10);
      this.#uiManager.selectMonth(jy, jm);
    });
  }

  // ====================================================================
  // Data Loading
  // ====================================================================

  /**
   * Loads all transactions from the database and refreshes the UI.
   * @private
   */
  async #loadTransactions() {
    this.#uiManager.showLoading();

    const result = await this.#transactionsService.fetchAll();

    this.#uiManager.hideLoading();

    if (!result.success) {
      this.#uiManager.showError(result.error || "Failed to load transactions.");
      return;
    }

    this.#uiManager.setTransactions(result.data);

    // Determine which month to select
    const currentSelected = this.#uiManager.getSelectedMonth();
    if (currentSelected) {
      // Check if the currently selected month still has transactions
      const months = this.#transactionsService.getUniqueJalaliMonths(
        result.data,
      );
      const stillExists = months.some(
        (m) => m.jy === currentSelected.jy && m.jm === currentSelected.jm,
      );

      if (stillExists) {
        // Keep current selection
        this.#uiManager.renderMonthList();
        this.#uiManager.renderTransactionList();
      } else {
        // Month no longer has transactions, auto-select
        this.#uiManager.renderMonthList();
        this.#uiManager.autoSelectMonth();
      }
    } else {
      this.#uiManager.renderMonthList();
      this.#uiManager.autoSelectMonth();
    }
  }

  // ====================================================================
  // Helpers
  // ====================================================================

  /**
   * Finds a transaction by ID from the local cache in UIManager.
   * @param {string} id - Transaction ID
   * @returns {Object|undefined}
   * @private
   */
  #findTransactionById(id) {
    const transactions = this.#uiManager.transactions || [];
    return transactions.find((t) => t.id === id);
  }
}

// ========================================================================
// Bootstrap Application
// ========================================================================

export const app = new ExpenseTrackerApp();

// Wait for DOM to be ready (in browser environment)
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => app.init());
  } else {
    app.init();
  }
}
