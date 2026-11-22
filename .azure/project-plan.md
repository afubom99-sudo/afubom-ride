# Afubom Ride Integration for Existing Afu Bike App

**Status:** Planning
**Created:** 2026-11-22
**Mode:** Direct implementation

## 1. Project Overview

Apply Afubom ride branding and customer contact choices to the existing AFU Bike workspace.

Keep the current account system and booking flows. Do not replace or remove existing account bookings. The public experience should present **ride** and **delivery** as the two service choices, with WhatsApp and call actions using **+237681497411**.

The name **Afubom ride** must replace the old visible BAMENDA Bikes branding in the affected interface. Blue, black, and white are the target brand colors. The workspace continuity phrase is not site copy.

## 2. Goals

- Integrate the updated branding into the existing application rather than creating a separate project.
- Preserve customer, rider, admin accounts and account-based bookings.
- Keep ride and delivery available as the only requested service options.
- Provide WhatsApp and call actions from the existing public landing experience.
- Add a QR code target for the deployed existing app URL.
- Apply blue, black, and white consistently across existing screens.

## 3. Requirements

### 3.1 Functional Requirements

- Use the business name **Afubom ride** in visible branding locations.
- Expose only **ride** and **delivery** as selectable customer service choices.
- Preserve existing sign-in, customer, rider, and admin flows.
- Preserve existing account bookings and booking history.
- Generate a prefilled WhatsApp message containing the selected ride or delivery service.
- Open WhatsApp for **+237681497411**.
- Provide a call link for **+237681497411**.
- Generate a QR code for the final public URL of the existing app.
- Do not present extra services or invented business copy.

### 3.2 Non Functional Requirements

- Keep the application mobile-first and responsive.
- Preserve existing accessibility behavior and keyboard navigation.
- Avoid breaking existing API contracts or database records.
- Maintain clear contrast with blue, black, and white.
- Keep changes narrowly scoped to branding and public contact entry points.

## 4. Architecture

The solution modifies the existing modular application:

- Frontend: existing vanilla JavaScript modules, semantic HTML, and CSS in `frontend/`.
- Backend: existing FastAPI application in `backend/app/`.
- Database: existing SQLite for local development and PostgreSQL configuration for production.
- Authentication: existing JWT account flows and role-based customer, rider, and admin interfaces.
- Storage: existing account and booking records remain in place.
- External actions: WhatsApp and telephone links are implemented by the frontend.

No new standalone landing page application or separate backend is required.

## 5. Technical Stack

- Frontend language: existing JavaScript
- Frontend framework: plain HTML, CSS, and JavaScript modules
- Backend language: Python
- Backend framework: existing custom FastAPI
- Database: SQLite locally and PostgreSQL for production
- Authentication: existing account and JWT implementation
- WhatsApp integration: `wa.me` with URL encoded service text
- Call integration: `tel:+237681497411`
- QR code: generated for the final public app URL

## 6. Design System & UI

**Component Library:** Pico.css

**Style Direction:** Blue, black, and white high contrast branding with the existing application structure preserved.

- Primary color: blue
- Secondary color: black
- Base color: white
- Brand name: Afubom ride
- Service choices: ride and delivery
- Primary public actions: WhatsApp and call
- Existing booking UI: retain and rebrand rather than replace

Account dashboards and booking history must remain recognizable and continue to use the existing customer, rider, and admin workflows.

## 7. Implementation Plan

1. Update visible public and workspace branding from Bamenda Bikes to Afubom ride.
2. Update the public service messaging to ride and delivery only.
3. Add service selection that links to WhatsApp with the chosen service.
4. Add the call action for +237681497411.
5. Retain all sign-in and account booking routes unchanged.
6. Replace existing green and teal visual accents with blue where appropriate, while preserving black and white.
7. Generate a QR code after the existing app receives its final public URL.

## 8. Data Model

Keep the existing data model and records unchanged.

- Customer accounts: unchanged
- Rider accounts: unchanged
- Admin accounts: unchanged
- Bookings: unchanged and continue to be available through account history
- The WhatsApp service choice is a frontend-generated message parameter, not a new stored booking state.

## 9. Testing & Validation

- Verify Afubom ride branding appears in public and workspace surfaces.
- Verify only ride and delivery options are presented.
- Verify WhatsApp opens for +237681497411 with the selected service.
- Verify the call link is +237681497411.
- Verify sign-in and account booking flows still work.
- Verify existing bookings remain visible after the branding changes.
- Verify customer, rider, and admin pages remain usable.
- Verify the layout on mobile and desktop widths.
- Verify blue, black, and white contrast and keyboard accessibility.
- Verify the QR code opens the final public app URL.

## 10. Deployment & Operations

- Implement changes only in the existing workspace.
- Run the existing backend and frontend locally.
- Run the existing test suite before deployment.
- Preserve environment configuration and existing database migration requirements.
- Publish the existing app at a public HTTPS URL.
- Generate the QR code from that final URL.
