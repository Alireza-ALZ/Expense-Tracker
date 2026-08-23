// ============================================================================
// Persian (Jalali/Shamsi) Calendar Date Picker
// ============================================================================
// A custom-built Persian calendar date picker component.
// Uses Jalaali.js for date conversion.
//
// Usage:
//   const picker = new PersianDatePicker({
//       inputElement: document.getElementById('date-input'),
//       onSelect: (jy, jm, jd, gregorianStr) => { ... }
//   });
//
// The picker attaches to an input element and shows a calendar dropdown.
// ============================================================================

(function () {
    'use strict';

    /**
     * Creates a new Persian Date Picker instance.
     * @param {Object} options
     * @param {HTMLElement} options.inputElement - The input to attach to
     * @param {Function} options.onSelect - Callback: (jy, jm, jd, gregorianDateStr) => void
     */
    function PersianDatePicker(options) {
        this.input = options.inputElement;
        this.onSelect = options.onSelect || function () {};

        // Currently displayed month/year in the calendar
        const today = Jalaali.todayJalaali();
        this.viewYear = today.jy;
        this.viewMonth = today.jm;

        // Selected date
        this.selectedYear = null;
        this.selectedMonth = null;
        this.selectedDay = null;

        // Gregorian string for form submission
        this.gregorianValue = '';

        // Build the DOM
        this._createPicker();
        this._bindEvents();
    }

    /**
     * Creates the picker DOM structure.
     */
    PersianDatePicker.prototype._createPicker = function () {
        // Wrapper around input
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'pdp-wrapper';
        this.input.parentNode.insertBefore(this.wrapper, this.input);
        this.wrapper.appendChild(this.input);

        // Calendar dropdown
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'pdp-dropdown';
        this.dropdown.setAttribute('role', 'dialog');
        this.dropdown.setAttribute('aria-label', 'Persian Calendar');
        this.wrapper.appendChild(this.dropdown);

        this._render();
    };

    /**
     * Binds all event listeners.
     */
    PersianDatePicker.prototype._bindEvents = function () {
        const self = this;

        // Toggle calendar on input click/focus
        this.input.addEventListener('click', function (e) {
            e.stopPropagation();
            self._toggle();
        });

        // Make input read-only to prevent manual typing
        this.input.setAttribute('readonly', 'true');
        this.input.style.cursor = 'pointer';

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (!self.wrapper.contains(e.target)) {
                self._close();
            }
        });

        // Keyboard navigation
        this.dropdown.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                self._close();
                self.input.focus();
            }
        });

        // Delegate clicks inside the dropdown
        this.dropdown.addEventListener('click', function (e) {
            e.stopPropagation();

            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            if (action === 'prev-month') {
                self._changeMonth(-1);
            } else if (action === 'next-month') {
                self._changeMonth(1);
            } else if (action === 'prev-year') {
                self._changeYear(-1);
            } else if (action === 'next-year') {
                self._changeYear(1);
            } else if (action === 'select-day') {
                const day = parseInt(target.dataset.day, 10);
                self._selectDate(self.viewYear, self.viewMonth, day);
            } else if (action === 'today') {
                const today = Jalaali.todayJalaali();
                self.viewYear = today.jy;
                self.viewMonth = today.jm;
                self._selectDate(today.jy, today.jm, today.jd);
            }
        });
    };

    /**
     * Toggles the calendar dropdown.
     */
    PersianDatePicker.prototype._toggle = function () {
        const isOpen = this.dropdown.classList.contains('pdp-dropdown--open');
        if (isOpen) {
            this._close();
        } else {
            this._open();
        }
    };

    /**
     * Opens the calendar dropdown.
     */
    PersianDatePicker.prototype._open = function () {
        this._render();
        this.dropdown.classList.add('pdp-dropdown--open');
    };

    /**
     * Closes the calendar dropdown.
     */
    PersianDatePicker.prototype._close = function () {
        this.dropdown.classList.remove('pdp-dropdown--open');
    };

    /**
     * Changes the displayed month.
     * @param {number} delta - +1 or -1
     */
    PersianDatePicker.prototype._changeMonth = function (delta) {
        this.viewMonth += delta;
        if (this.viewMonth > 12) {
            this.viewMonth = 1;
            this.viewYear++;
        } else if (this.viewMonth < 1) {
            this.viewMonth = 12;
            this.viewYear--;
        }
        this._render();
    };

    /**
     * Changes the displayed year.
     * @param {number} delta - +1 or -1
     */
    PersianDatePicker.prototype._changeYear = function (delta) {
        this.viewYear += delta;
        this._render();
    };

    /**
     * Selects a date and updates the input.
     */
    PersianDatePicker.prototype._selectDate = function (jy, jm, jd) {
        this.selectedYear = jy;
        this.selectedMonth = jm;
        this.selectedDay = jd;

        // Convert to Gregorian for storage
        this.gregorianValue = Jalaali.jalaaliToGregorianString(jy, jm, jd);

        // Display Jalaali date in the input
        this.input.value = Jalaali.formatJalaali(jy, jm, jd);

        // Call the onSelect callback
        this.onSelect(jy, jm, jd, this.gregorianValue);

        this._close();
        this._render();
    };

    /**
     * Renders the calendar grid.
     */
    PersianDatePicker.prototype._render = function () {
        const today = Jalaali.todayJalaali();
        const daysInMonth = Jalaali.jalaaliMonthLength(this.viewYear, this.viewMonth);

        // Day of week for the 1st of this month (0=Sat, 6=Fri)
        const firstDayOfWeek = Jalaali.jalaaliDayOfWeek(this.viewYear, this.viewMonth, 1);

        let html = '<div class="pdp-calendar">';

        // Header with navigation
        html += '<div class="pdp-header">';
        html += `<button type="button" class="pdp-nav-btn" data-action="prev-year" title="Previous Year">«</button>`;
        html += `<button type="button" class="pdp-nav-btn" data-action="prev-month" title="Previous Month">‹</button>`;
        html += `<span class="pdp-title">${Jalaali.getMonthName(this.viewMonth)} ${this.viewYear}</span>`;
        html += `<button type="button" class="pdp-nav-btn" data-action="next-month" title="Next Month">›</button>`;
        html += `<button type="button" class="pdp-nav-btn" data-action="next-year" title="Next Year">»</button>`;
        html += '</div>';

        // Weekday headers (Sat to Fri)
        html += '<div class="pdp-weekdays">';
        for (const name of Jalaali.WEEKDAY_NAMES) {
            html += `<span class="pdp-weekday">${name}</span>`;
        }
        html += '</div>';

        // Days grid
        html += '<div class="pdp-days">';

        // Empty cells before the first day
        for (let i = 0; i < firstDayOfWeek; i++) {
            html += '<span class="pdp-day pdp-day--empty"></span>';
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const classes = ['pdp-day'];

            // Check if this is today
            if (
                day === today.jd &&
                this.viewMonth === today.jm &&
                this.viewYear === today.jy
            ) {
                classes.push('pdp-day--today');
            }

            // Check if this is the selected date
            if (
                day === this.selectedDay &&
                this.viewMonth === this.selectedMonth &&
                this.viewYear === this.selectedYear
            ) {
                classes.push('pdp-day--selected');
            }

            html += `<span class="${classes.join(' ')}" data-action="select-day" data-day="${day}" role="button" tabindex="0">${day}</span>`;
        }

        html += '</div>';

        // Today button
        html += '<div class="pdp-footer">';
        html += `<button type="button" class="pdp-today-btn" data-action="today">Today</button>`;
        html += '</div>';

        html += '</div>';

        this.dropdown.innerHTML = html;
    };

    /**
     * Sets the picker to a specific Jalaali date.
     * @param {number} jy - Jalaali year
     * @param {number} jm - Jalaali month
     * @param {number} jd - Jalaali day
     */
    PersianDatePicker.prototype.setDate = function (jy, jm, jd) {
        this.viewYear = jy;
        this.viewMonth = jm;
        this.selectedYear = jy;
        this.selectedMonth = jm;
        this.selectedDay = jd;

        this.gregorianValue = Jalaali.jalaaliToGregorianString(jy, jm, jd);
        this.input.value = Jalaali.formatJalaali(jy, jm, jd);
    };

    /**
     * Sets the picker from a Gregorian date string (YYYY-MM-DD).
     * @param {string} gregorianStr - e.g., "2024-08-22"
     */
    PersianDatePicker.prototype.setFromGregorian = function (gregorianStr) {
        const j = Jalaali.gregorianStringToJalaali(gregorianStr);
        this.setDate(j.jy, j.jm, j.jd);
    };

    /**
     * Clears the picker.
     */
    PersianDatePicker.prototype.clear = function () {
        this.selectedYear = null;
        this.selectedMonth = null;
        this.selectedDay = null;
        this.gregorianValue = '';
        this.input.value = '';

        const today = Jalaali.todayJalaali();
        this.viewYear = today.jy;
        this.viewMonth = today.jm;
    };

    /**
     * Gets the currently selected Gregorian date string.
     * @returns {string} e.g., "2024-08-22" or empty string
     */
    PersianDatePicker.prototype.getValue = function () {
        return this.gregorianValue;
    };

    // ========================================================================
    // Public API
    // ========================================================================

    window.PersianDatePicker = PersianDatePicker;
})();
