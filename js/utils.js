// ============================================================================
// Utility Functions
// ============================================================================
// Formatting helpers, currency display, and general-purpose utilities.
// All functions are namespaced under window.Utils.
// ============================================================================

(function () {
    'use strict';

    // ========================================================================
    // Currency Formatting
    // ========================================================================
    // Isolated currency logic — change CURRENCY_LABEL and formatAmount
    // to support a different currency in the future.

    const CURRENCY_LABEL = 'Toman';

    /**
     * Formats a numeric amount with thousands separator.
     * @param {number} amount - The amount to format
     * @returns {string} Formatted amount (e.g., "1,250,000")
     */
    function formatAmount(amount) {
        return Number(amount).toLocaleString('en-US');
    }

    /**
     * Formats an amount with currency label.
     * @param {number} amount - The amount to format
     * @returns {string} e.g., "1,250,000 Toman"
     */
    function formatAmountWithCurrency(amount) {
        return `${formatAmount(amount)} ${CURRENCY_LABEL}`;
    }

    // ========================================================================
    // Number Parsing
    // ========================================================================

    /**
     * Converts Persian/Arabic digits in a string to Latin digits.
     * Handles both Persian (۰-۹) and Arabic (٠-٩) numeral systems.
     * @param {string} str - Input string
     * @returns {string} String with Latin digits
     */
    function persianToLatinDigits(str) {
        if (!str) return str;
        return str
            .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
            .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    }

    /**
     * Parses a numeric string that may contain Persian digits or separators.
     * @param {string} str - Input string
     * @returns {number|NaN} Parsed number
     */
    function parseNumber(str) {
        if (!str) return NaN;
        const cleaned = persianToLatinDigits(String(str).trim()).replace(/,/g, '');
        return Number(cleaned);
    }

    // ========================================================================
    // DOM Helpers
    // ========================================================================

    /**
     * Shorthand for querySelector.
     * @param {string} selector - CSS selector
     * @param {Element} [parent=document] - Parent element
     * @returns {Element|null}
     */
    function $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    /**
     * Shorthand for querySelectorAll.
     * @param {string} selector - CSS selector
     * @param {Element} [parent=document] - Parent element
     * @returns {NodeList}
     */
    function $$(selector, parent = document) {
        return parent.querySelectorAll(selector);
    }

    /**
     * Creates a DOM element with optional attributes and children.
     * @param {string} tag - HTML tag name
     * @param {Object} [attrs] - Attributes to set
     * @param  {...(string|Element)} children - Child elements or text
     * @returns {Element}
     */
    function createElement(tag, attrs = {}, ...children) {
        const el = document.createElement(tag);

        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'dataset') {
                Object.assign(el.dataset, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        }

        for (const child of children) {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        }

        return el;
    }

    // ========================================================================
    // Toast Notifications
    // ========================================================================

    /**
     * Shows a toast notification to the user.
     * @param {string} message - The message to display
     * @param {'success'|'error'|'info'} type - Toast type
     * @param {number} duration - Display duration in ms (default: 3000)
     */
    function showToast(message, type = 'info', duration = 3000) {
        // Get or create toast container
        let container = document.getElementById('toast-container');
        if (!container) {
            container = createElement('div', { id: 'toast-container' });
            document.body.appendChild(container);
        }

        const toast = createElement('div', {
            className: `toast toast--${type}`
        });

        // Icon based on type
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast__icon">${icons[type] || icons.info}</span>
            <span class="toast__message">${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('toast--visible');
        });

        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('toast--visible');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }

    // ========================================================================
    // Miscellaneous
    // ========================================================================

    /**
     * Escapes HTML special characters to prevent XSS.
     * @param {string} str - Input string
     * @returns {string} Escaped string
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    /**
     * Generates a simple unique ID (for temporary UI purposes).
     * @returns {string}
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Debounce function to limit rapid calls.
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function}
     */
    function debounce(fn, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ========================================================================
    // Public API
    // ========================================================================

    window.Utils = {
        CURRENCY_LABEL,
        formatAmount,
        formatAmountWithCurrency,
        persianToLatinDigits,
        parseNumber,
        $,
        $$,
        createElement,
        showToast,
        escapeHtml,
        generateId,
        debounce
    };
})();
