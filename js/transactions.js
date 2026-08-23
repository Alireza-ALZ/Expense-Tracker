// ============================================================================
// Transactions Module
// ============================================================================
// CRUD operations for transactions via Supabase.
// Handles database communication and data transformation.
//
// Date strategy:
// - Dates are stored in PostgreSQL as DATE (Gregorian format: YYYY-MM-DD)
// - Jalali conversion happens in the UI layer only
// - Month filtering converts Jalali month boundaries to Gregorian date ranges
//
// Requires: SupabaseClient, Jalaali
// ============================================================================

(function () {
    'use strict';

    // ========================================================================
    // CRUD Operations
    // ========================================================================

    /**
     * Fetches all transactions for the current user.
     * Returns transactions ordered by date descending, then created_at descending.
     * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
     */
    async function fetchAll() {
        try {
            const client = SupabaseClient.get();
            const { data, error } = await client
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data: data || [] };
        } catch (err) {
            return { success: false, error: 'Failed to fetch transactions.' };
        }
    }

    /**
     * Creates a new transaction.
     * @param {Object} transaction
     * @param {string} transaction.title - Transaction title
     * @param {string} [transaction.description] - Optional description
     * @param {number} transaction.amount - Amount in Toman (positive)
     * @param {string} transaction.type - 'income' or 'expense'
     * @param {string} transaction.date - Gregorian date string (YYYY-MM-DD)
     * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
     */
    async function create(transaction) {
        try {
            const client = SupabaseClient.get();

            // Get current user's ID for the user_id column
            const { data: { user } } = await client.auth.getUser();
            if (!user) {
                return { success: false, error: 'You must be logged in to add a transaction.' };
            }

            const { data, error } = await client
                .from('transactions')
                .insert({
                    user_id: user.id,
                    title: transaction.title.trim(),
                    description: (transaction.description || '').trim(),
                    amount: transaction.amount,
                    type: transaction.type,
                    date: transaction.date
                })
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            return { success: false, error: 'Failed to create transaction.' };
        }
    }

    /**
     * Updates an existing transaction.
     * @param {string} id - Transaction UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
     */
    async function update(id, updates) {
        try {
            const client = SupabaseClient.get();

            const updateData = {};
            if (updates.title !== undefined) updateData.title = updates.title.trim();
            if (updates.description !== undefined) updateData.description = (updates.description || '').trim();
            if (updates.amount !== undefined) updateData.amount = updates.amount;
            if (updates.type !== undefined) updateData.type = updates.type;
            if (updates.date !== undefined) updateData.date = updates.date;

            const { data, error } = await client
                .from('transactions')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            return { success: false, error: 'Failed to update transaction.' };
        }
    }

    /**
     * Deletes a transaction.
     * @param {string} id - Transaction UUID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async function remove(id) {
        try {
            const client = SupabaseClient.get();
            const { error } = await client
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: 'Failed to delete transaction.' };
        }
    }

    // ========================================================================
    // Jalali Month Filtering
    // ========================================================================

    /**
     * Computes the Gregorian date range for a given Jalali month.
     * This is used to filter transactions by Jalali month using
     * Gregorian dates stored in the database.
     *
     * @param {number} jy - Jalaali year
     * @param {number} jm - Jalaali month (1-12)
     * @returns {{ startDate: string, endDate: string }} Gregorian date range (inclusive)
     */
    function getGregorianRangeForJalaliMonth(jy, jm) {
        // First day of the Jalali month → Gregorian
        const startDate = Jalaali.jalaaliToGregorianString(jy, jm, 1);

        // Last day of the Jalali month → Gregorian
        const daysInMonth = Jalaali.jalaaliMonthLength(jy, jm);
        const endDate = Jalaali.jalaaliToGregorianString(jy, jm, daysInMonth);

        return { startDate, endDate };
    }

    /**
     * Filters an array of transactions to only those within a Jalali month.
     * @param {Array} transactions - All transactions
     * @param {number} jy - Jalaali year
     * @param {number} jm - Jalaali month
     * @returns {Array} Filtered transactions
     */
    function filterByJalaliMonth(transactions, jy, jm) {
        const { startDate, endDate } = getGregorianRangeForJalaliMonth(jy, jm);
        return transactions.filter(
            (t) => t.date >= startDate && t.date <= endDate
        );
    }

    /**
     * Extracts unique Jalali months from a list of transactions.
     * Returns an array of { jy, jm } objects sorted by year/month descending.
     * @param {Array} transactions - All transactions
     * @returns {Array<{jy: number, jm: number}>} Unique months
     */
    function getUniqueJalaliMonths(transactions) {
        const monthSet = new Map();

        for (const t of transactions) {
            const j = Jalaali.gregorianStringToJalaali(t.date);
            const key = `${j.jy}-${j.jm}`;
            if (!monthSet.has(key)) {
                monthSet.set(key, { jy: j.jy, jm: j.jm });
            }
        }

        // Sort by year descending, then month descending
        return Array.from(monthSet.values()).sort((a, b) => {
            if (a.jy !== b.jy) return b.jy - a.jy;
            return b.jm - a.jm;
        });
    }

    // ========================================================================
    // Calculations
    // ========================================================================

    /**
     * Calculates income, expense, and balance totals.
     * @param {Array} transactions - Array of transaction objects
     * @returns {{ income: number, expense: number, balance: number }}
     */
    function calculateTotals(transactions) {
        let income = 0;
        let expense = 0;

        for (const t of transactions) {
            if (t.type === 'income') {
                income += Number(t.amount);
            } else {
                expense += Number(t.amount);
            }
        }

        return {
            income,
            expense,
            balance: income - expense
        };
    }

    // ========================================================================
    // Public API
    // ========================================================================

    window.Transactions = {
        fetchAll,
        create,
        update,
        remove,
        getGregorianRangeForJalaliMonth,
        filterByJalaliMonth,
        getUniqueJalaliMonths,
        calculateTotals
    };
})();
