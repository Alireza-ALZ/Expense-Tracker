// ============================================================================
// Persian (Jalali/Shamsi) Calendar Date Picker (ES Module Class)
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

import * as JalaaliModule from "./jalaali.js";

export class PersianDatePicker {
  #input;
  #onSelect;
  #viewYear;
  #viewMonth;
  #selectedYear;
  #selectedMonth;
  #selectedDay;
  #gregorianValue;
  #wrapper;
  #dropdown;
  #jalaali;

  /**
   * Creates a new Persian Date Picker instance.
   * @param {Object} options
   * @param {HTMLElement} options.inputElement - The input to attach to
   * @param {Function} [options.onSelect] - Callback: (jy, jm, jd, gregorianDateStr) => void
   * @param {Object} [options.jalaaliLib] - Injected Jalaali library
   */
  constructor(options) {
    this.#input = options.inputElement;
    this.#onSelect = options.onSelect || function () {};
    this.#jalaali = options.jalaaliLib || JalaaliModule;

    // Currently displayed month/year in the calendar
    const today = this.#jalaali.todayJalaali();
    this.#viewYear = today.jy;
    this.#viewMonth = today.jm;

    // Selected date
    this.#selectedYear = null;
    this.#selectedMonth = null;
    this.#selectedDay = null;

    // Gregorian string for form submission
    this.#gregorianValue = "";

    // Build the DOM and bind events
    this.#createPicker();
    this.#bindEvents();
  }

  // ====================================================================
  // Getters
  // ====================================================================

  get inputElement() {
    return this.#input;
  }

  get selectedDate() {
    if (!this.#selectedYear) return null;
    return {
      jy: this.#selectedYear,
      jm: this.#selectedMonth,
      jd: this.#selectedDay,
      gregorian: this.#gregorianValue,
    };
  }

  // ====================================================================
  // DOM Creation & Event Binding
  // ====================================================================

  /**
   * Creates the picker DOM structure.
   * @private
   */
  #createPicker() {
    // Wrapper around input
    this.#wrapper = document.createElement("div");
    this.#wrapper.className = "pdp-wrapper";
    this.#input.parentNode.insertBefore(this.#wrapper, this.#input);
    this.#wrapper.appendChild(this.#input);

    // Calendar dropdown
    this.#dropdown = document.createElement("div");
    this.#dropdown.className = "pdp-dropdown";
    this.#dropdown.setAttribute("role", "dialog");
    this.#dropdown.setAttribute("aria-label", "Persian Calendar");
    this.#wrapper.appendChild(this.#dropdown);

    this.#render();
  }

  /**
   * Binds all event listeners.
   * @private
   */
  #bindEvents() {
    // Toggle calendar on input click/focus
    this.#input.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#toggle();
    });

    // Make input read-only to prevent manual typing
    this.#input.setAttribute("readonly", "true");
    this.#input.style.cursor = "pointer";

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.#wrapper.contains(e.target)) {
        this.#close();
      }
    });

    // Keyboard navigation
    this.#dropdown.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.#close();
        this.#input.focus();
      }
    });

    // Delegate clicks inside the dropdown
    this.#dropdown.addEventListener("click", (e) => {
      e.stopPropagation();

      const target = e.target.closest("[data-action]");
      if (!target) return;

      const action = target.dataset.action;

      if (action === "prev-month") {
        this.#changeMonth(-1);
      } else if (action === "next-month") {
        this.#changeMonth(1);
      } else if (action === "prev-year") {
        this.#changeYear(-1);
      } else if (action === "next-year") {
        this.#changeYear(1);
      } else if (action === "select-day") {
        const day = parseInt(target.dataset.day, 10);
        this.#selectDate(this.#viewYear, this.#viewMonth, day);
      } else if (action === "today") {
        const today = this.#jalaali.todayJalaali();
        this.#viewYear = today.jy;
        this.#viewMonth = today.jm;
        this.#selectDate(today.jy, today.jm, today.jd);
      }
    });
  }

  /**
   * Toggles the calendar dropdown.
   * @private
   */
  #toggle() {
    const isOpen = this.#dropdown.classList.contains("pdp-dropdown--open");
    if (isOpen) {
      this.#close();
    } else {
      this.#open();
    }
  }

  /**
   * Opens the calendar dropdown.
   * @private
   */
  #open() {
    this.#render();
    this.#dropdown.classList.add("pdp-dropdown--open");
  }

  /**
   * Closes the calendar dropdown.
   * @private
   */
  #close() {
    this.#dropdown.classList.remove("pdp-dropdown--open");
  }

  /**
   * Changes the displayed month.
   * @param {number} delta - +1 or -1
   * @private
   */
  #changeMonth(delta) {
    this.#viewMonth += delta;
    if (this.#viewMonth > 12) {
      this.#viewMonth = 1;
      this.#viewYear++;
    } else if (this.#viewMonth < 1) {
      this.#viewMonth = 12;
      this.#viewYear--;
    }
    this.#render();
  }

  /**
   * Changes the displayed year.
   * @param {number} delta - +1 or -1
   * @private
   */
  #changeYear(delta) {
    this.#viewYear += delta;
    this.#render();
  }

  /**
   * Selects a date and updates the input.
   * @private
   */
  #selectDate(jy, jm, jd) {
    this.#selectedYear = jy;
    this.#selectedMonth = jm;
    this.#selectedDay = jd;

    // Convert to Gregorian for storage
    this.#gregorianValue = this.#jalaali.jalaaliToGregorianString(jy, jm, jd);

    // Display Jalaali date in the input
    this.#input.value = this.#jalaali.formatJalaali(jy, jm, jd);

    // Call the onSelect callback
    this.#onSelect(jy, jm, jd, this.#gregorianValue);

    this.#close();
    this.#render();
  }

  /**
   * Renders the calendar grid.
   * @private
   */
  #render() {
    const jalaali = this.#jalaali;
    const today = jalaali.todayJalaali();
    const daysInMonth = jalaali.jalaaliMonthLength(
      this.#viewYear,
      this.#viewMonth,
    );

    // Day of week for the 1st of this month (0=Sat, 6=Fri)
    const firstDayOfWeek = jalaali.jalaaliDayOfWeek(
      this.#viewYear,
      this.#viewMonth,
      1,
    );

    let html = '<div class="pdp-calendar">';

    // Header with navigation
    html += '<div class="pdp-header">';
    html += `<button type="button" class="pdp-nav-btn" data-action="prev-year" title="Previous Year">«</button>`;
    html += `<button type="button" class="pdp-nav-btn" data-action="prev-month" title="Previous Month">‹</button>`;
    html += `<span class="pdp-title">${jalaali.getMonthName(this.#viewMonth)} ${this.#viewYear}</span>`;
    html += `<button type="button" class="pdp-nav-btn" data-action="next-month" title="Next Month">›</button>`;
    html += `<button type="button" class="pdp-nav-btn" data-action="next-year" title="Next Year">»</button>`;
    html += "</div>";

    // Weekday headers (Sat to Fri)
    html += '<div class="pdp-weekdays">';
    for (const name of jalaali.WEEKDAY_NAMES) {
      html += `<span class="pdp-weekday">${name}</span>`;
    }
    html += "</div>";

    // Days grid
    html += '<div class="pdp-days">';

    // Empty cells before the first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      html += '<span class="pdp-day pdp-day--empty"></span>';
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const classes = ["pdp-day"];

      // Check if this is today
      if (
        day === today.jd &&
        this.#viewMonth === today.jm &&
        this.#viewYear === today.jy
      ) {
        classes.push("pdp-day--today");
      }

      // Check if this is the selected date
      if (
        day === this.#selectedDay &&
        this.#viewMonth === this.#selectedMonth &&
        this.#viewYear === this.#selectedYear
      ) {
        classes.push("pdp-day--selected");
      }

      html += `<span class="${classes.join(" ")}" data-action="select-day" data-day="${day}" role="button" tabindex="0">${day}</span>`;
    }

    html += "</div>";

    // Today button
    html += '<div class="pdp-footer">';
    html += `<button type="button" class="pdp-today-btn" data-action="today">Today</button>`;
    html += "</div>";

    html += "</div>";

    this.#dropdown.innerHTML = html;
  }

  // ====================================================================
  // Public API Methods
  // ====================================================================

  /**
   * Sets the picker to a specific Jalaali date.
   * @param {number} jy - Jalaali year
   * @param {number} jm - Jalaali month
   * @param {number} jd - Jalaali day
   */
  setDate(jy, jm, jd) {
    this.#viewYear = jy;
    this.#viewMonth = jm;
    this.#selectedYear = jy;
    this.#selectedMonth = jm;
    this.#selectedDay = jd;

    this.#gregorianValue = this.#jalaali.jalaaliToGregorianString(jy, jm, jd);
    this.#input.value = this.#jalaali.formatJalaali(jy, jm, jd);
  }

  /**
   * Sets the picker from a Gregorian date string (YYYY-MM-DD).
   * @param {string} gregorianStr - e.g., "2024-08-22"
   */
  setFromGregorian(gregorianStr) {
    const j = this.#jalaali.gregorianStringToJalaali(gregorianStr);
    this.setDate(j.jy, j.jm, j.jd);
  }

  /**
   * Clears the picker.
   */
  clear() {
    this.#selectedYear = null;
    this.#selectedMonth = null;
    this.#selectedDay = null;
    this.#gregorianValue = "";
    this.#input.value = "";

    const today = this.#jalaali.todayJalaali();
    this.#viewYear = today.jy;
    this.#viewMonth = today.jm;
  }

  /**
   * Gets the currently selected Gregorian date string.
   * @returns {string} e.g., "2024-08-22" or empty string
   */
  getValue() {
    return this.#gregorianValue;
  }
}
