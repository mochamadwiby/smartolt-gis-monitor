# App Flow Document for SmartOLT GIS Monitoring Application

## Onboarding and Sign-In/Sign-Up

When a new user first visits the SmartOLT GIS Monitoring application, they arrive on a clean landing page that introduces the purpose of the tool and invites them to sign in or create an account. The landing page displays a prominent sign-in button and a link to register. To create an account, the user clicks the register link, which takes them to a registration page featuring a simple form that asks for their email address, a secure password, and a confirmation of the password. After completing the form and agreeing to the terms, the user submits the registration request. The system validates the email and password, creates a new user record in the PostgreSQL database, and then sends a confirmation email if email verification is enabled. Once the account is verified, the user is automatically redirected to the sign-in page.

On the sign-in page, the user enters their registered email and password. The application uses Better Auth to validate credentials, start a secure session, and issue a session token stored in an HTTP-only cookie. If the user provides an incorrect email or password, a clear inline error message appears below the form explaining the mismatch. If the user has forgotten their password, they click a "Forgot Password" link that leads to a password recovery page. There, they enter their registered email, receive a password reset link, follow it to a reset page, choose a new password, and submit. The new password is stored securely, the old session is invalidated, and the user is prompted to sign in again.

Once authenticated, the user is taken directly into the main application. A sign-out option is always available in the header or within the user avatar menu, which clears the session cookie and returns the user to the landing page.

## Main Dashboard or Home Page

After signing in, the user lands on the dashboard at the `/dashboard` route. The page is laid out in three main areas: a header at the top, a collapsible sidebar on the left, and a central workspace containing the GIS map by default. The header shows the application logo, a toggle switch for light and dark themes, and the user’s avatar. Clicking the avatar opens a dropdown menu with links to account settings and a sign-out button.

The sidebar provides navigation links labeled Map View, OLT List, and Outage History. The active link is highlighted. When the user first arrives, the Map View is selected and the central workspace shows an interactive map centered on the network’s geographic area. The map displays markers for each ONU and ODP, color-coded by status. From the dashboard, the user can click on Map View again to refresh the map, or switch to the OLT List or Outage History views.

## Detailed Feature Flows and Page Transitions

In the Map View, the application performs a client-side fetch to the internal API endpoint at `/api/smartolt/onus`. The endpoint gathers GPS coordinates and status data from the external SmartOLT API, merges them, and returns a structured payload. As soon as the data arrives, the map component renders markers for each ONU and ODP. Lines connect each ONU to its parent ODP to create the “antline effect.” If the user clicks on any ONU marker, an overlay dialog appears at the center of the screen. This dialog is implemented using the Shadcn UI dialog component and spawns a secondary fetch to `/api/smartolt/onu/details/[externalId]` for the selected ONU. While the details load, a spinner is shown. Once the data arrives, the dialog displays the ONU’s last signal strength, error counts, firmware version, and any notes.

When the user selects the OLT List link in the sidebar, the page transitions without full reload to `/dashboard/olts`. This view uses the Shadcn UI data table component to display a paginated, filterable list of all OLTs retrieved from `/api/smartolt/olts`. The table supports column sorting and a search field. Clicking any row opens a side sheet containing more in-depth details about that OLT, including port counts and current connected ONU statistics.

In the Outage History view, the user is shown an interactive chart component built with the chart-area-interactive UI element. The page makes a request to `/api/smartolt/onu/signal-graph` for historical signal data across all ONUs. The chart supports hover tooltips and a date range selector. When the user adjusts the date range, the page issues a new fetch to update the chart in real time.

Administrators have an additional navigation link labeled User Management. Choosing it takes them to `/admin/users`, a secured page where they can view and edit user roles. This view lists all accounts and their permission levels. Editing a user opens a modal dialog that allows the admin to change roles or disable access. Upon saving, the application issues a request to `/api/admin/users/[userId]` to update the record in the database.

## Settings and Account Management

At all times, the user can access personal settings from the avatar menu in the header. Selecting Settings navigates to `/settings/profile`. This page displays the user’s name, email, and password change form. The user can update their display name or email and submit the form. The server validates the new email for uniqueness before saving. To change the password, the user must enter their current password and the new password twice. Submitting triggers an API call to `/api/auth/change-password`, which verifies the current password and updates it securely.

Below the profile section, the user finds preferences for theme (light or dark) and notification settings (email alerts for major outages). Each toggle updates the user’s profile settings in the database via a single API call. After saving, the page shows a brief confirmation message and a button to return to the dashboard.

## Error States and Alternate Paths

If the application fails to authenticate a user due to invalid credentials, an inline error message appears under the input fields advising the user to check their email or reset their password. When network connectivity is lost while loading the dashboard data, a prominent banner appears at the top of the central workspace with a retry button. Clicking retry attempts to fetch the data again. If the external SmartOLT API is unreachable or returns an error, the internal API translates the error into a user-friendly message displayed in a modal or banner explaining that data is temporarily unavailable.

Unauthorized attempts to access secure routes such as `/dashboard` or `/admin/users` redirect the user back to the sign-in page with a message indicating they need to log in. If a session expires mid-use, the user is automatically routed to the sign-in page with a note that their session has timed out. Any 404 pages, such as mistyped URLs, show a simple message and a button to return to the dashboard or landing page.

## Conclusion and Overall App Journey

In summary, the SmartOLT GIS Monitoring application guides the user from a welcoming landing page through secure account creation and sign-in, and places them immediately into a dynamic dashboard. The Map View provides a real-time geographic display of network components, with interactive dialogs for detailed ONU information. The OLT List and Outage History views deliver tabular and chart-based insights, respectively, while administrators can manage user roles in a dedicated panel. Settings let users control their profile, password, theme, and notifications. Throughout the experience, clear error messaging and retry mechanisms keep the user informed and in control. This flow ensures that network operations personnel can quickly sign in, access critical data, and respond to outages with minimal friction.