// ============================================================================
// Transactions Repository & Domain Service (Class-based)
// ============================================================================
// Encapsulates CRUD operations for transactions via Supabase database
// and domain logic: Jalali month filtering, unique month grouping,
// and financial totals calculations.
//
// Date strategy:
// - Dates are stored in PostgreSQL as DATE (Gregorian format: YYYY-MM-DD)
// - Jalali conversion happens in the UI/domain layer
// - Month filtering converts Jalali month boundaries to Gregorian date ranges
//
// Requires: SupabaseClient, Jalaali
// ============================================================================

(function () {
    'use strict';

    class TransactionService {
        #supabaseClient;
        #jalaali;

        /**
         * @param {SupabaseClientService} [clientService] - Injected Supabase client service
         * @param {Object} [jalaaliLib] - Injected Jalaali calendar library
         */
        constructor(clientService = window.SupabaseClient, jalaaliLib = window.Jalaali) {
            this.#supabaseClient = clientService;
            this.#jalaali = jalaaliLib;
        }

        /**
         * Helper to get active Supabase client instance.
         * @private
         */
        #getClient() {
            return this.#supabaseClient.get();
        }

        // ====================================================================
        // CRUD Operations
        // ====================================================================

        /**
         * Fetches all transactions for the current user.
         * Returns transactions ordered by date descending, then created_at descending.
         * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
         */
        async fetchAll() {
            try {
                const client = this.#getClient();
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
        async create(transaction) {
            try {
                const client = this.#getClient();

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
        async update(id, updates) {
            try {
                const client = this.#getClient();

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
        async remove(id) {
            try {
                const client = this.#getClient();
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

        // ====================================================================
        // Jalali Month Filtering & Calculations (Domain Logic)
        // ====================================================================

        /**
         * Computes the Gregorian date range for a given Jalali month.
         * This is used to filter transactions by Jalali month using
         * Gregorian dates stored in the database.
         *
         * @param {number} jy - Jalaali year
         * @param {number} jm - Jalaali month (1-12)
         * @returns {{ startDate: string, endDate: string }} Gregorian date range (inclusive)
         */
        getGregorianRangeForJalaliMonth(jy, jm) {
            const jalaali = this.#jalaali || window.Jalaali;
            // First day of the Jalali month → Gregorian
            const startDate = jalaali.jalaaliToGregorianString(jy, jm, 1);

            // Last day of the Jalali month → Gregorian
            const daysInMonth = jalaali.jalaaliMonthLength(jy, jm);
            const endDate = jalaali.jalaaliToGregorianString(jy, jm, daysInMonth);

            return { startDate, endDate };
        }

        /**
         * Filters an array of transactions to only those within a Jalali month.
         * @param {Array} transactions - All transactions
         * @param {number} jy - Jalaali year
         * @param {number} jm - Jalaali month
         * @returns {Array} Filtered transactions
         */
        filterByJalaliMonth(transactions, jy, jm) {
            const { startDate, endDate } = this.getGregorianRangeForJalaliMonth(jy, jm);
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
        getUniqueJalaliMonths(transactions) {
            const jalaali = this.#jalaali || window.Jalaali;
            const monthSet = new Map();

            for (const t of transactions) {
                const j = jalaali.gregorianStringToJalaali(t.date);
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

        /**
         * Calculates income, expense, and balance totals.
         * @param {Array} transactions - Array of transaction objects
         * @returns {{ income: number, expense: number, balance: number }}
         */
        calculateTotals(transactions) {
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
    }

    // Export class and singleton instance
    window.TransactionService = TransactionService;
    window.Transactions = new TransactionService();
})();
