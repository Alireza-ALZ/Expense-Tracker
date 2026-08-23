// ============================================================================
// Jalaali (Jalali/Shamsi) Calendar Conversion Library
// ============================================================================
// Based on the jalaali-js algorithm by Behrang Noruzi Niya
// (https://github.com/jalaali/jalaali-js)
//
// This module provides accurate Jalali ↔ Gregorian date conversion
// with proper handling of leap years and month boundaries.
//
// All functions are namespaced under window.Jalaali to avoid global pollution.
// ============================================================================

(function () {
    'use strict';

    // ========================================================================
    // Core Algorithm
    // ========================================================================

    /**
     * Converts a Jalaali date to Gregorian.
     * @param {number} jy - Jalaali year (e.g., 1403)
     * @param {number} jm - Jalaali month (1-12)
     * @param {number} jd - Jalaali day (1-31)
     * @returns {{ gy: number, gm: number, gd: number }}
     */
    function toGregorian(jy, jm, jd) {
        const jdn = jalaaliToJdn(jy, jm, jd);
        return jdnToGregorian(jdn);
    }

    /**
     * Converts a Gregorian date to Jalaali.
     * @param {number} gy - Gregorian year
     * @param {number} gm - Gregorian month (1-12)
     * @param {number} gd - Gregorian day (1-31)
     * @returns {{ jy: number, jm: number, jd: number }}
     */
    function toJalaali(gy, gm, gd) {
        const jdn = gregorianToJdn(gy, gm, gd);
        return jdnToJalaali(jdn);
    }

    /**
     * Checks if a Jalaali year is a leap year.
     * @param {number} jy - Jalaali year
     * @returns {boolean}
     */
    function isLeapJalaaliYear(jy) {
        return jalaaliCal(jy).leap === 0;
    }

    /**
     * Returns the number of days in a given Jalaali month.
     * @param {number} jy - Jalaali year
     * @param {number} jm - Jalaali month (1-12)
     * @returns {number} Number of days (29, 30, or 31)
     */
    function jalaaliMonthLength(jy, jm) {
        if (jm <= 6) return 31;
        if (jm <= 11) return 30;
        return isLeapJalaaliYear(jy) ? 30 : 29;
    }

    /**
     * Checks if a Jalaali date is valid.
     * @param {number} jy - Jalaali year
     * @param {number} jm - Jalaali month (1-12)
     * @param {number} jd - Jalaali day
     * @returns {boolean}
     */
    function isValidJalaaliDate(jy, jm, jd) {
        return (
            jy >= -61 &&
            jy <= 3177 &&
            jm >= 1 &&
            jm <= 12 &&
            jd >= 1 &&
            jd <= jalaaliMonthLength(jy, jm)
        );
    }

    // ========================================================================
    // Internal Helper Functions
    // ========================================================================

    /**
     * This function determines if the Jalaali year is leap (0),
     * and finds the day in March of the first day of the Jalaali year.
     */
    function jalaaliCal(jy) {
        // Jalaali years starting the 2820-year cycle
        const breaks = [
            -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060,
            2097, 2192, 2262, 2324, 2394, 2456, 3178
        ];

        const bl = breaks.length;
        const gy = jy + 621;
        let leapJ = -14;
        let jp = breaks[0];
        let jump;

        if (jy < jp || jy >= breaks[bl - 1]) {
            throw new Error('Invalid Jalaali year ' + jy);
        }

        for (let i = 1; i < bl; i++) {
            const jm2 = breaks[i];
            jump = jm2 - jp;

            if (jy < jm2) break;

            leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
            jp = jm2;
        }

        let n = jy - jp;

        leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);

        if (mod(jump, 33) === 4 && jump - n === 4) {
            leapJ += 1;
        }

        const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
        const march = 20 + leapJ - leapG;

        // Find the leap years of Jalaali
        if (jump - n < 6) {
            n = n - jump + div(jump + 4, 33) * 33;
        }

        let leap = mod(mod(n + 1, 33) - 1, 4);

        if (leap === -1) {
            leap = 4;
        }

        return { leap, gy, march };
    }

    /**
     * Converts Jalaali date to Julian Day Number.
     */
    function jalaaliToJdn(jy, jm, jd) {
        const r = jalaaliCal(jy);
        return (
            gregorianToJdn(r.gy, 3, r.march) +
            (jm - 1) * 31 -
            div(jm, 7) * (jm - 7) +
            jd -
            1
        );
    }

    /**
     * Converts Julian Day Number to Jalaali date.
     */
    function jdnToJalaali(jdn) {
        const g = jdnToGregorian(jdn);
        let jy = g.gy - 621;
        const r = jalaaliCal(jy);
        const jdn1f = gregorianToJdn(g.gy, 3, r.march);
        let jd, jm, k;

        k = jdn - jdn1f;
        if (k >= 0) {
            if (k <= 185) {
                jm = 1 + div(k, 31);
                jd = mod(k, 31) + 1;
                return { jy, jm, jd };
            } else {
                k -= 186;
            }
        } else {
            jy -= 1;
            k += 179;
            if (r.leap === 1) k += 1;
        }

        jm = 7 + div(k, 30);
        jd = mod(k, 30) + 1;
        return { jy, jm, jd };
    }

    /**
     * Converts Gregorian date to Julian Day Number.
     */
    function gregorianToJdn(gy, gm, gd) {
        let d =
            div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
            div(153 * mod(gm + 9, 12) + 2, 5) +
            gd -
            34840408;
        d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
        return d;
    }

    /**
     * Converts Julian Day Number to Gregorian date.
     */
    function jdnToGregorian(jdn) {
        let l = jdn + 68569;
        const n = div(4 * l, 146097);
        l = l - div(146097 * n + 3, 4);
        const i = div(4000 * (l + 1), 1461001);
        l = l - div(1461 * i, 4) + 31;
        const j = div(80 * l, 2447);
        const gd = l - div(2447 * j, 80);
        l = div(j, 11);
        const gm = j + 2 - 12 * l;
        const gy = 100 * (n - 49) + i + l;
        return { gy, gm, gd };
    }

    /**
     * Integer division.
     */
    function div(a, b) {
        return ~~(a / b);
    }

    /**
     * Modulo that handles negative numbers correctly.
     */
    function mod(a, b) {
        return a - ~~(a / b) * b;
    }

    // ========================================================================
    // Convenience Functions
    // ========================================================================

    /**
     * Gets today's date in Jalaali.
     * @returns {{ jy: number, jm: number, jd: number }}
     */
    function todayJalaali() {
        const now = new Date();
        return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    /**
     * Converts a Gregorian date string (YYYY-MM-DD) to Jalaali.
     * @param {string} dateStr - Gregorian date string (e.g., "2024-08-22")
     * @returns {{ jy: number, jm: number, jd: number }}
     */
    function gregorianStringToJalaali(dateStr) {
        const [gy, gm, gd] = dateStr.split('-').map(Number);
        return toJalaali(gy, gm, gd);
    }

    /**
     * Converts a Jalaali date to a Gregorian date string (YYYY-MM-DD).
     * @param {number} jy - Jalaali year
     * @param {number} jm - Jalaali month (1-12)
     * @param {number} jd - Jalaali day
     * @returns {string} Gregorian date string (e.g., "2024-08-22")
     */
    function jalaaliToGregorianString(jy, jm, jd) {
        const g = toGregorian(jy, jm, jd);
        const year = String(g.gy).padStart(4, '0');
        const month = String(g.gm).padStart(2, '0');
        const day = String(g.gd).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Persian month names.
     */
    const MONTH_NAMES = [
        'فروردین',    // 1
        'اردیبهشت',   // 2
        'خرداد',      // 3
        'تیر',        // 4
        'مرداد',      // 5
        'شهریور',     // 6
        'مهر',        // 7
        'آبان',       // 8
        'آذر',        // 9
        'دی',         // 10
        'بهمن',       // 11
        'اسفند'       // 12
    ];

    /**
     * Persian weekday names (Saturday first, as is standard in Iran).
     */
    const WEEKDAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    /**
     * Full Persian weekday names.
     */
    const WEEKDAY_NAMES_FULL = [
        'شنبه',
        'یکشنبه',
        'دوشنبه',
        'سه‌شنبه',
        'چهارشنبه',
        'پنجشنبه',
        'جمعه'
    ];

    /**
     * Gets the Persian month name.
     * @param {number} month - Month number (1-12)
     * @returns {string}
     */
    function getMonthName(month) {
        return MONTH_NAMES[month - 1] || '';
    }

    /**
     * Formats a Jalaali date as a string.
     * @param {number} jy - Jalaali year
     * @param {number} jm - Jalaali month
     * @param {number} jd - Jalaali day
     * @returns {string} Formatted date (e.g., "1403/06/01")
     */
    function formatJalaali(jy, jm, jd) {
        return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    }

    /**
     * Formats a Jalaali date with Persian month name.
     * @param {number} jy - Jalaali year
     * @param {number} jm - Jalaali month
     * @param {number} jd - Jalaali day
     * @returns {string} e.g., "1 شهریور 1403"
     */
    function formatJalaaliPersian(jy, jm, jd) {
        return `${jd} ${getMonthName(jm)} ${jy}`;
    }

    /**
     * Gets the day of week (0=Saturday, 6=Friday) for a Jalaali date.
     * @param {number} jy - Jalaali year
     * @param {number} jm - Jalaali month
     * @param {number} jd - Jalaali day
     * @returns {number} 0-6 (Saturday to Friday)
     */
    function jalaaliDayOfWeek(jy, jm, jd) {
        const g = toGregorian(jy, jm, jd);
        const date = new Date(g.gy, g.gm - 1, g.gd);
        // JavaScript: 0=Sunday, 6=Saturday
        // We want: 0=Saturday, 6=Friday
        return (date.getDay() + 1) % 7;
    }

    // ========================================================================
    // Public API
    // ========================================================================

    window.Jalaali = {
        toGregorian,
        toJalaali,
        isLeapJalaaliYear,
        jalaaliMonthLength,
        isValidJalaaliDate,
        todayJalaali,
        gregorianStringToJalaali,
        jalaaliToGregorianString,
        MONTH_NAMES,
        WEEKDAY_NAMES,
        WEEKDAY_NAMES_FULL,
        getMonthName,
        formatJalaali,
        formatJalaaliPersian,
        jalaaliDayOfWeek
    };
})();
