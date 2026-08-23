[ROLE]
You are a Senior Frontend Developer with expertise in HTML, CSS, and Vanilla JavaScript. Your task is to build clean and production-quality code suitable as a web development project.

[OBJECTIVE]
Create a fully functional Expense Tracker web application using only HTML, CSS, and Vanilla JavaScript.

The final project should be:
- Simple and realistic
- Very beautiful and attractive in appearance
- The architecture must be in a way that can add new features easily in future
- UI labels, buttons, validation messages, errors, and navigation must be English. User-entered transaction title/description may be Persian or any Unicode text.

[TECH_STACK]
- HTML5
- CSS3
- Vanilla JavaScript ES6+
- No frontend frameworks
- No external libraries unless explicitly approved.
- No build tools
- No CSS frameworks unless explicitly approved

[PROJECT_FEATURES]
Implement the following features:

1. Add a new transaction.
2. Each transaction must include:
   - Title
   - Description (optional)
   - Amount
   - Type:
     - Income
     - Expense
   - Date (Shamsi) 

3. For the Shamsi date, provide a Persian/Jalali calendar date picker so users can easily select a date.

4. Display:
   - Total Balance
   - Total Income
   - Total Expenses

5. Show all transactions of current Shamsi month in a list:
    - Display transactions ordered by date descending.
    - For transactions on the same date, display newest created transaction first.

6. Show each Shamsi months which has any transactions in a list.

7. Allow users to delete a transaction.

8. Allow users to edit an existing transaction.

9. Persist data using Supabase database: --> https://supabase.com
    - You have "SUPABASE_URL" & "SUPABASE_PUBLISHABLE_KEY"

10. Automatically restore saved transactions when the page reloads.

11. Update all calculations dynamically after every add/edit/delete action.

12. When the user selects a Shamsi month, display only the transactions belonging to that month and update the summary calculations accordingly.
13. The currently selected month must be visually distinguishable.
14. The current Shamsi month should be selected by default.

[DATE_REQUIREMENTS]

Use the Persian (Jalali/Shamsi) calendar throughout the user interface.

Requirements:
- Users must select dates using a Persian/Jalali calendar date picker.
- Do not require the user to manually type a date.
- Store the transaction date using a technically appropriate canonical database representation, preferably a PostgreSQL DATE value when the transaction represents a calendar day rather than a specific time.
- Do not store the formatted Jalali display value (for example, "1405/06/01") as the primary database date representation.
- Convert the stored date to Jalali format only when displaying dates or performing Jalali calendar/month operations in the application.
- Explain the chosen date storage and conversion approach before implementation.
- Display dates to users in Jalali format.
- Correctly handle Jalali month boundaries and leap years.
- Month filtering must be based on the Jalali calendar, not Gregorian month numbers.
- The UI must show Persian month names.
- A small, well-maintained external library may be used only if it is necessary for implementing a reliable Persian/Jalali calendar date picker.
- If an external library is necessary, explain why it is needed and identify the library before using it.
- Do not use an external library for any other functionality unless explicitly approved.

[AMOUNT_DISPLAY]

- The application uses Iranian Toman as its currency.
- All monetary amounts must be displayed in Toman.
- Do not display amounts in Iranian Rial.
- Store the numeric amount in the database as Toman.
- Display monetary values using appropriate thousands separators.
- Do not include unnecessary decimal places.
- Keep the currency formatting logic isolated so it can be changed easily in the future.
- Clearly indicate the currency as "Toman" where appropriate in the user interface.

[UI_REQUIREMENTS]
Design a modern and clean interface with the following sections:

- Application Header
- Balance Summary Card
- Income and Expense Summary Cards
- Transaction Form
- Transaction History List
- A list of Shamsi months which has transactions.
- Use a Light Theme and a button for switching to Dark mode.
- Primary brand color: #36d8c2

The design should:
- Be responsive.
- Work well on mobile and desktop.
- Use CSS Flexbox and/or Grid.
- Include subtle hover effects.
- Have a distinctive shadow.
- Have clear visual distinction between income and expense items.
- Use semantic HTML elements.

[UX_REQUIREMENTS]

Implement:
- Loading state while fetching transactions.
- Empty state when the current month has no transactions.
- Empty state when no transaction months exist.
- Error state when database operations fail.
- Disabled/submitting state while saving or deleting.
- Confirmation before deleting a transaction.
- Clear success/error feedback after CRUD operations.
- When editing a transaction, populate the transaction form with its existing values.
- Clearly indicate that the form is in edit mode.
- Provide a way to cancel editing and return the form to "Add Transaction" mode.

[FORM_VALIDATION]
Implement validation rules:

- Title cannot be empty.
- Amount must be a valid positive number.
- Transaction type must be selected.
- Date must be a valid Shamsi date.
- Display user-friendly error messages.
- Prevent invalid submissions.

[JAVASCRIPT_REQUIREMENTS]

Use clean JavaScript practices:

- Organize the application into small, cohesive classes and reusable functions.
- Build the architecture in a way that can add new features easily.
- Use classes for parts of the application that have their own state, behavior, or lifecycle.
- Use regular functions for simple stateless utility operations.
- Keep responsibilities separated and avoid large classes with unrelated responsibilities.
- Avoid putting all application logic into a single class or file.
- Use:
  - const and let
  - Template literals
  - Array methods
  - addEventListener

Avoid:
- Global variables whenever possible.
- Duplicate code.
- Inline event handlers.

[FILE_STRUCTURE]
Generate the project using exactly these files:

1. Expense Tracker/
│
├── index.html
├── style.css
├── app.js --> "JS" folder if need some js files.
│
├── config.example.js --> For "SUPABASE_URL" & "SUPABASE_PUBLISHABLE_KEY"
├── config.js
├── .gitignore --> Do not add this for now.
│
├── supabase/
│   └── schema.sql --> Schema creation query for database table.
│
└── README.md --> Do not add this for now.

- `config.example.js` contains placeholder Supabase configuration values.
- `config.js` contains the user's actual Supabase Project URL and Publishable Key and must be loaded by the application at runtime.

[ARCHITECTURE]
The architecture must be in a way that can add new features easily in future. To apply this architecture, if need to change folder structure of project (FILE_STRUCTURE section), tell me and explain why the new file structure is better that file structure above, if I apply you can change the FILE_STRUCTURE

[PROGRAMMING_PARADIGM]

Use a class-based Object-Oriented Programming (OOP) architecture.

Requirements:
- Use ES6+ classes for parts of the application that have their own state, behavior, or lifecycle.
- Prefer ES6 classes over constructor functions and prototype-based patterns.
- Encapsulate related state and behavior inside appropriate classes.
- Use private class fields/methods (`#`) where they improve encapsulation and are supported by the target browsers.
- Keep each class focused on a single responsibility.
- Use regular functions for simple stateless utility operations where a class would add unnecessary complexity.
- Do not force every function or piece of logic into a class.
- Avoid unnecessary inheritance; prefer composition when appropriate.
- Avoid static/global mutable state whenever possible.
- Organize classes and related code into separate ES6 modules when the project structure benefits from it.

[DEPLOYMENT_MODEL]

This repository is an open-source template.

Each person who forks the repository must use their own independent Supabase project.

Requirements:
- Do not depend on the original author's Supabase project.
- Do not hardcode the author's Supabase URL.
- Do not hardcode the author's Supabase publishable key.
- Do not share data between different Supabase projects.
- `supabase/schema.sql` must be sufficient to initialize the required database schema and RLS policies in a new Supabase project.
- Running `schema.sql` in a fresh Supabase project must create the complete required schema, constraints, indexes, RLS, and policies without requiring manual SQL changes.
- The README is intentionally omitted for now, but the source code must contain clear comments explaining the required configuration.
- The application must require Supabase Authentication before displaying the expense tracker. Only authenticated users may access the application and its data. Database access must be enforced using PostgreSQL Row Level Security (RLS). The application must never rely only on frontend JavaScript checks for authorization.
- Make sure this project is safe to run and use and tell me the necessary information.

[AUTHENTICATION]

The application must provide both Sign Up and Login functionality.
Implement Supabase Authentication using email/password.

Requirements:
- A new owner must be able to create an account directly from the application's authentication UI.
- Provide separate Login and Sign Up views/forms.
- After successful Sign Up, guide the user to the Login flow or automatically authenticate them if supported safely.
- The application is designed for personal use by one owner. Do not implement multi-user collaboration, sharing, teams, invitations, or role management.
- Multiple accounts do not need to be supported as a feature.
- Do not implement multi-user collaboration, sharing, teams, invitations, or role management.
- The user must be authenticated before accessing the main application.
- Unauthenticated users must see only the login page.
- Persist the authenticated session across page reloads.
- Provide Sign Up, Login, and Logout functionality.
- Display a clear authentication error for invalid credentials.
- Do not expose or use Supabase secret/service_role keys anywhere in frontend code.
- Use only the Supabase publishable key in the browser.
- Authorization must never depend only on frontend checks.
- Database access must be protected using PostgreSQL Row Level Security (RLS).

[SECURITY_RULES]

Security is critical.

- The browser may use only the Supabase Project URL and Supabase Publishable Key.
- The Supabase Publishable Key is intentionally public and may appear in frontend source code.
- NEVER use, expose, commit, or embed a Supabase Secret Key or legacy `service_role` key in client-side code.
- NEVER assume that hiding a publishable key provides security.
- All database authorization must be enforced by PostgreSQL Row Level Security.
- Authentication must be handled by Supabase Auth.
- Frontend authorization checks are only for UX and must not be treated as security controls.

[DATABASE_SCHEMA_AND_INTEGRITY]

The database schema must enforce data integrity at the PostgreSQL level, not only through JavaScript validation.

Requirements:
- Every transaction must contain a `user_id` column.
- `user_id` must reference `auth.users(id)`.
- `user_id` must be NOT NULL.
- `title` must be NOT NULL.
- `amount` must be NOT NULL.
- `amount` must be greater than zero.
- `type` must be NOT NULL.
- `type` must only allow `income` or `expense`.
- `date` must be NOT NULL.
- Include a `created_at` timestamp with an appropriate default value.
- Use appropriate PostgreSQL data types for all columns.
- Add appropriate indexes for frequently queried fields, especially `user_id` and transaction date.
- Enable Row Level Security on the transactions table.
- Create RLS policies for SELECT, INSERT, UPDATE, and DELETE.
- Authenticated users must only be able to access and modify transactions where `user_id = auth.uid()`.
- Anonymous users must not be able to access transaction data.
- The `supabase/schema.sql` file must contain all required table definitions, constraints, indexes, RLS configuration, and policies.
- Running `schema.sql` in a new Supabase project must be sufficient to initialize the complete database structure required by the application.

[CODE_QUALITY]
Ensure that the code is:
- Readable
- Well-commented
- Good error handling
- Consistently formatted
- Easy to extend in future lessons

[TESTING]

Before finalizing:
- Verify authentication flows.
- Verify transaction creation.
- Verify transaction deletion.
- Verify transaction editing.
- Verify month filtering.
- Verify income/expense calculations.
- Verify invalid form submissions.
- Verify unauthenticated users cannot access transaction data.
- Verify that unauthenticated users cannot SELECT, INSERT, UPDATE, or DELETE transactions through the Supabase API.

[FINAL_INSTRUCTION]
Do not guess anything while implementing the project. If something is ambiguous, explain that and ask me, I will tell you exactly what you should do.
Do not provide pseudocode or partial snippets.
Generate the complete working project with production-ready code and educational explanations.
