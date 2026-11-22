# MASTER SOFTWARE ENGINEERING PROMPT
## BAMENDA BIKES & DELIVERY PLATFORM

### ROLE AND RESPONSIBILITY

Act as a Senior Software Architect, Full-Stack Software Engineer, Backend Engineer, Database Engineer, Security Engineer, UI/UX Designer, DevOps Engineer, and Technical Project Lead.

Your task is to architect, develop, test, and prepare for deployment a complete, modern, secure, scalable, and maintainable motorcycle transportation and delivery platform called **Bamenda Bikes & Delivery**.

This is a real-world software project intended to serve customers, motorcycle riders, delivery operators, and administrators in Bamenda, Cameroon, with the possibility of expanding to other cities in Cameroon and eventually other African countries.

Do not treat this as a simple static website, school project, or demonstration dashboard. Build a structured software system with a functional frontend, backend, database, authentication, APIs, business logic, security controls, and deployment architecture.

Do not implement everything in one file. Follow professional software engineering principles, modular architecture, separation of concerns, reusable components, secure coding practices, and maintainable code.

---

# 1. PROJECT VISION

Create a digital platform that connects customers with verified motorcycle riders for:

1. Motorcycle transportation.
2. Parcel delivery.
3. Document delivery.
4. Food delivery.
5. Grocery delivery.
6. Other permitted local delivery services.

The platform must provide three primary interfaces:

- Customer application.
- Rider application.
- Administrative dashboard.

All three applications must communicate with a centralized backend API and share a properly designed database.

The system must be responsive, mobile-first, accessible, and optimized for users with low-end Android phones, limited data, and unstable internet connections.

The platform should be designed around the realities of operating in Bamenda, Cameroon, including:

- Mobile-first usage.
- Mobile Money payments.
- Cash payments.
- Local phone numbers.
- Poor or intermittent network connectivity.
- Local addresses and landmarks.
- Motorcycle transportation.
- Local delivery operations.
- XAF/CFA currency.
- English-first interface, with architecture supporting French localization later.

---

# 2. TECHNOLOGY STACK

Use the following technology stack unless a technical limitation requires a justified alternative.

## Frontend

- HTML5.
- CSS3.
- Vanilla JavaScript using ES6+.
- Fetch API for backend communication.
- Leaflet for interactive maps.
- OpenStreetMap-compatible mapping services.
- Responsive design.
- Progressive Web App architecture where appropriate.

Avoid unnecessary frontend frameworks in the initial version.

The frontend must be modular, maintainable, and properly separated into pages, stylesheets, components, and JavaScript modules.

## Backend

- Python.
- FastAPI.
- Pydantic.
- SQLAlchemy 2.x.
- Alembic.
- PostgreSQL.
- REST API.
- WebSockets for real-time functionality.

## Additional infrastructure

- Redis when necessary for caching, rate limiting, or background tasks.
- Background task processing when needed.
- Git and GitHub.
- Environment variables for secrets.
- Docker and Docker Compose for reproducible environments.
- Automated testing.
- Production deployment configuration.

---

# 3. SYSTEM ARCHITECTURE

Design the application using a modular monolith architecture.

Do not begin with microservices.

The backend must have clearly separated modules, allowing future migration into independent services if the platform grows.

The system architecture must include:

CLIENT LAYER:
- Customer frontend.
- Rider frontend.
- Admin dashboard.

API LAYER:
- FastAPI application.
- API versioning.
- Authentication.
- Authorization.
- Request validation.
- Response handling.
- Error handling.
- Rate limiting.

BUSINESS LOGIC LAYER:
- Authentication service.
- User service.
- Rider management service.
- Booking service.
- Fare calculation service.
- Rider matching service.
- Tracking service.
- Payment service.
- Notification service.
- Review service.
- Administration service.

DATA LAYER:
- PostgreSQL.
- SQLAlchemy ORM.
- Database migrations using Alembic.
- Proper indexes.
- Foreign key relationships.
- Database transactions.
- Data integrity constraints.

EXTERNAL SERVICES:
- Maps.
- Geocoding.
- Routing.
- Mobile Money providers.
- SMS.
- Email.
- Push notifications.
- File storage.

INFRASTRUCTURE:
- Frontend hosting.
- Backend hosting.
- Database hosting.
- HTTPS.
- Backups.
- Logging.
- Monitoring.
- Error tracking.

Create architecture diagrams, database diagrams, API documentation, and a clear explanation of how every layer communicates.

---

# 4. USER ROLES AND PERMISSIONS

Implement a secure role-based access control system.

## CUSTOMER

Customers must be able to:

- Register.
- Login.
- Logout.
- Verify their phone number where supported.
- Manage their profile.
- Request bike rides.
- Request deliveries.
- Select pickup and destination locations.
- View estimated fares.
- Confirm bookings.
- Cancel bookings subject to business rules.
- View booking history.
- Track assigned riders.
- View booking details.
- View payment status.
- Make payments.
- Rate completed bookings.
- Submit complaints.
- Receive notifications.

## RIDER

Riders must be able to:

- Register.
- Login.
- Submit rider application.
- Submit required verification information.
- Submit motorcycle information.
- Upload required verification documents securely.
- View application status.
- Set availability.
- Go online or offline.
- Receive booking requests.
- Accept or reject booking requests.
- View assigned bookings.
- Navigate to pickup and destination.
- Update booking status.
- Share location during active bookings.
- View completed bookings.
- View earnings.
- View payment records.
- Receive notifications.
- Submit support requests.

## ADMINISTRATOR

Administrators must be able to:

- Login securely.
- View platform statistics.
- View users.
- View riders.
- Approve or reject rider applications.
- Suspend or reactivate accounts.
- Manage bookings.
- View active bookings.
- Manage fare configurations.
- View payments.
- Manage complaints.
- Review reports.
- Monitor suspicious activity.
- View operational analytics.
- Manage platform settings.
- Audit important actions.

Create a detailed permissions matrix.

Implement both role-level and object-level authorization.

A user must never be able to access another user's private records by changing an ID in a URL or API request.

---

# 5. AUTHENTICATION AND SECURITY

Security must be implemented from the beginning.

Implement:

- Secure password hashing using Argon2 or an appropriate secure password hashing algorithm.
- Authentication.
- Authorization.
- Access token management.
- Secure session handling.
- Refresh token rotation if refresh tokens are implemented.
- Logout and token invalidation strategy.
- Password reset.
- Phone verification architecture.
- Email verification where applicable.
- Login rate limiting.
- Registration rate limiting.
- Protection against brute-force attacks.
- Input validation.
- SQL injection prevention.
- XSS protection.
- CSRF protection where applicable.
- Secure HTTP headers.
- HTTPS in production.
- CORS configuration.
- Secrets management.
- File upload validation.
- Secure file storage.
- Admin security.
- Audit logging.
- Error handling that does not leak sensitive information.

Never:

- Store plaintext passwords.
- Hardcode API keys.
- Hardcode database credentials.
- Expose secret environment variables to the frontend.
- Trust frontend authorization.
- Trust frontend fare calculations.
- Trust payment confirmation from the frontend.
- Expose private rider documents publicly.
- Expose private customer information unnecessarily.

Use environment variables and provide a `.env.example` file.

---

# 6. DATABASE DESIGN

Use PostgreSQL as the primary production database.

Design a normalized relational database with appropriate relationships, constraints, indexes, and timestamps.

Create models and migrations for at least the following entities:

## Users

Fields should include:

- ID.
- Full name.
- Phone number.
- Email where applicable.
- Password hash.
- Role.
- Account status.
- Verification status.
- Created timestamp.
- Updated timestamp.

## Rider profiles

Fields should include:

- Rider ID.
- User ID.
- License information.
- Motorcycle details.
- Motorcycle registration.
- Rider verification status.
- Availability status.
- Rating.
- Created timestamp.
- Updated timestamp.

## Bookings

Fields should include:

- Booking ID.
- Customer ID.
- Rider ID.
- Booking type.
- Pickup address.
- Destination address.
- Pickup coordinates.
- Destination coordinates.
- Estimated distance.
- Estimated duration.
- Estimated fare.
- Final fare.
- Booking status.
- Payment status.
- Special instructions.
- Created timestamp.
- Assigned timestamp.
- Started timestamp.
- Completed timestamp.
- Cancelled timestamp.

## Payments

Fields should include:

- Payment ID.
- Booking ID.
- Customer ID.
- Amount.
- Currency.
- Payment method.
- Provider.
- Transaction reference.
- Payment status.
- Provider response reference.
- Created timestamp.
- Updated timestamp.

## Rider locations

Fields should include:

- Rider ID.
- Latitude.
- Longitude.
- Accuracy.
- Timestamp.
- Active booking reference where applicable.

Implement location retention rules to protect user privacy.

## Booking status history

Fields should include:

- Booking ID.
- Previous status.
- New status.
- Changed by user.
- Timestamp.
- Optional notes.

## Reviews

Fields should include:

- Booking ID.
- Customer ID.
- Rider ID.
- Rating.
- Comment.
- Timestamp.

## Notifications

Fields should include:

- User ID.
- Notification type.
- Title.
- Message.
- Read status.
- Timestamp.

## Complaints

Fields should include:

- Booking ID.
- Customer ID.
- Rider ID.
- Complaint category.
- Description.
- Status.
- Admin response.
- Timestamp.

## Fare configurations

Fields should include:

- Service type.
- Base fare.
- Per-kilometer rate.
- Minimum fare.
- Waiting charges.
- Additional fees.
- Active status.
- Effective date.
- Administrator who created the configuration.

Create an ERD showing all relationships.

Use appropriate foreign keys, indexes, unique constraints, and transaction rules.

Do not store sensitive documents directly as publicly accessible database URLs.

---

# 7. BOOKING SYSTEM

Implement a complete booking lifecycle.

Booking statuses should include:

- REQUESTED.
- SEARCHING_FOR_RIDER.
- RIDER_ASSIGNED.
- RIDER_ARRIVED.
- IN_PROGRESS.
- COMPLETED.
- CANCELLED.

Create a state transition system.

Do not allow arbitrary status changes.

Examples:

- A booking cannot be completed before it starts.
- A rider cannot accept a completed booking.
- A customer cannot assign a rider.
- A rider cannot accept multiple incompatible active bookings.
- A booking cannot be assigned to an unverified rider.
- A completed booking cannot be cancelled normally.

Implement booking creation, validation, assignment, acceptance, cancellation, status updates, completion, and history.

Use database transactions and concurrency protection to prevent two riders from accepting the same booking.

Implement idempotency where necessary.

---

# 8. RIDER MATCHING SYSTEM

Develop a rider matching service.

The service should identify eligible riders based on:

- Verification status.
- Online status.
- Availability.
- Distance from pickup.
- Active booking status.
- Service compatibility.
- Operational constraints.

Start with a simple distance-based matching algorithm.

Later, improve it using:

- Rider ETA.
- Traffic.
- Rider ratings.
- Fairness.
- Rider workload.
- Service zones.

Do not expose sensitive rider data to customers.

Document the matching algorithm and its limitations.

---

# 9. FARE CALCULATION ENGINE

Implement fare calculation centrally in the backend.

The estimated fare should be calculated using configurable rules such as:

Fare = Base Fare + Distance Charge + Additional Charges.

Potential parameters:

- Base fare.
- Distance rate.
- Minimum fare.
- Waiting time.
- Delivery surcharge.
- Parcel size.
- Parcel weight.
- Special handling.
- Service type.

All pricing configurations must be manageable by authorized administrators.

Use XAF as the currency.

Do not invent real Bamenda prices.

Use clearly identified development/test pricing until actual business pricing is approved.

Return a fare breakdown to the frontend.

The frontend must never be the authority for the final fare.

---

# 10. MAPS AND LOCATION SERVICES

Integrate interactive maps using Leaflet.

Use appropriate map tile providers and respect their terms of service.

Implement:

- Pickup location selection.
- Destination selection.
- Search for locations.
- Geocoding architecture.
- Route display.
- Distance estimation.
- Estimated travel time.
- Rider location display.
- Customer location display where appropriate.
- Map markers.
- Map controls.
- Responsive map interface.

The application must support local addresses and landmarks where formal street addresses are unavailable.

Do not assume that all Bamenda locations have precise street addresses.

Allow users to provide:

- Landmark.
- Neighborhood.
- Additional pickup instructions.

Location permissions must be requested transparently.

---

# 11. REAL-TIME TRACKING

Implement WebSocket-based real-time functionality.

Rider location updates must only be shared when:

- The rider has granted location permission.
- The rider is online or actively completing a booking.
- The update is authorized by platform rules.

The system should support:

- Rider GPS updates.
- Customer live tracking.
- Booking status updates.
- Rider availability updates.
- Reconnection.
- Authentication for WebSocket connections.
- Authorization for tracking channels.
- Rate limiting.
- Location validation.
- Network interruption handling.

Avoid excessive GPS updates.

Optimize for mobile battery usage and limited internet connectivity.

Do not expose a rider's location to unrelated users.

---

# 12. PAYMENT SYSTEM

Initially support:

- Cash.
- Mobile Money.

Design the payment system so additional providers can be added.

Create a payment service abstraction.

Potential integrations include approved Cameroon-supported Mobile Money providers, subject to business onboarding and API availability.

Implement:

- Payment initiation.
- Payment references.
- Payment status.
- Payment verification.
- Provider callbacks/webhooks.
- Callback signature verification where supported.
- Idempotency.
- Duplicate payment prevention.
- Refund records.
- Transaction reconciliation.
- Payment logs.

Never trust the frontend to declare a payment successful.

Do not store PINs or sensitive payment credentials.

Use test mode when provider credentials are unavailable.

Do not fabricate successful payment transactions.

---

# 13. NOTIFICATION SYSTEM

Create a modular notification system supporting:

- In-app notifications.
- SMS.
- Email.
- Push notifications.

Notification events should include:

- Registration.
- Rider application.
- Rider approval.
- Booking creation.
- Rider assignment.
- Rider arrival.
- Trip start.
- Trip completion.
- Cancellation.
- Payment confirmation.
- Complaint updates.

Use a service abstraction so notification providers can be changed without rewriting business logic.

Support retry mechanisms for failed notifications.

---

# 14. FRONTEND DESIGN

Create a modern, professional, trustworthy, and locally relevant design.

The platform should not look like a generic template.

Design direction:

- Clean.
- Modern.
- Mobile-first.
- Easy to navigate.
- Fast.
- Accessible.
- Professional.
- Appropriate for a transport and delivery service.

Create a consistent design system:

- Color palette.
- Typography.
- Spacing.
- Buttons.
- Cards.
- Forms.
- Navigation.
- Modal dialogs.
- Notifications.
- Loading states.
- Empty states.
- Error states.

Build responsive layouts for:

- Mobile phones.
- Tablets.
- Desktop.

Customer interface should prioritize:

- Book a ride.
- Book a delivery.
- Pickup location.
- Destination.
- Fare estimate.
- Booking confirmation.
- Live tracking.

Rider interface should prioritize:

- Online/offline status.
- Incoming booking requests.
- Accept/reject controls.
- Active trip.
- Navigation.
- Earnings.

Admin interface should prioritize:

- Platform overview.
- Active bookings.
- Rider approvals.
- Users.
- Payments.
- Complaints.
- Analytics.
- Pricing management.

Do not create fake statistics that are presented as real data.

Use empty states when the database has no records.

---

# 15. API DESIGN

Create a versioned REST API.

Use the following prefix:

`/api/v1/`

Develop endpoints for:

Authentication:

- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/logout`
- POST `/auth/refresh`
- POST `/auth/password-reset`
- GET `/auth/me`

Users:

- GET `/users/me`
- PATCH `/users/me`

Riders:

- POST `/riders/apply`
- GET `/riders/me`
- PATCH `/riders/me`
- POST `/riders/availability`
- GET `/riders/requests`
- POST `/riders/requests/{booking_id}/accept`
- POST `/riders/requests/{booking_id}/reject`

Bookings:

- POST `/bookings`
- GET `/bookings`
- GET `/bookings/{booking_id}`
- POST `/bookings/{booking_id}/cancel`
- PATCH `/bookings/{booking_id}/status`

Tracking:

- POST `/tracking/location`
- GET `/tracking/bookings/{booking_id}`
- WebSocket `/ws/tracking/{booking_id}`

Payments:

- POST `/payments/initiate`
- GET `/payments/{payment_id}`
- POST `/payments/webhook/{provider}`

Reviews:

- POST `/reviews`
- GET `/reviews/riders/{rider_id}`

Admin:

- GET `/admin/dashboard`
- GET `/admin/users`
- GET `/admin/riders`
- POST `/admin/riders/{rider_id}/approve`
- POST `/admin/riders/{rider_id}/reject`
- GET `/admin/bookings`
- GET `/admin/payments`
- GET `/admin/complaints`
- PATCH `/admin/fares`

Adjust endpoint names where appropriate.

Use correct HTTP methods and status codes.

Document every endpoint using OpenAPI.

---

# 16. ERROR HANDLING

Create a consistent API error response format.

Errors should include:

- Error code.
- Human-readable message.
- Optional field validation details.
- Request identifier.

Handle:

- Validation errors.
- Authentication errors.
- Authorization errors.
- Not found errors.
- Booking conflicts.
- Database errors.
- Payment errors.
- Network errors.
- External service errors.

Never expose stack traces or database credentials to end users in production.

Frontend must display understandable error messages.

---

# 17. PERFORMANCE AND SCALABILITY

Prepare the system for increasing numbers of users.

Implement:

- Database indexes.
- Pagination.
- Efficient queries.
- Connection pooling.
- Caching where appropriate.
- Rate limiting.
- Background jobs.
- WebSocket connection management.
- Efficient location updates.
- File storage abstraction.
- API versioning.

Do not optimize prematurely.

Start with a reliable modular monolith.

Document the conditions under which Redis, background workers, additional service separation, or horizontal scaling would become necessary.

---

# 18. TESTING

Create a comprehensive testing strategy.

## Unit tests

Test:

- Password hashing.
- Fare calculations.
- Booking state transitions.
- Permissions.
- Validation.
- Rider matching.
- Payment status logic.

## Integration tests

Test:

- Registration.
- Login.
- Booking creation.
- Rider application.
- Rider approval.
- Booking acceptance.
- Status updates.
- Cancellation.
- Payment verification.
- Database relationships.

## Security tests

Test:

- Unauthorized access.
- Invalid tokens.
- Role violations.
- Object-level authorization.
- Rate limits.
- Malformed input.
- Duplicate booking acceptance.
- Duplicate payment callbacks.

## Frontend tests

Test:

- Form validation.
- API error handling.
- Responsive layouts.
- Navigation.
- Loading states.
- Booking workflow.

Do not claim tests passed unless they were actually executed.

---

# 19. DEPLOYMENT

Prepare the application for deployment.

Provide:

- `.env.example`.
- `.gitignore`.
- `requirements.txt`.
- Dockerfile.
- Docker Compose.
- PostgreSQL configuration.
- Database migration commands.
- Production configuration.
- Deployment documentation.

Possible deployment architecture:

Frontend:
- Vercel or equivalent.

Backend:
- Render, Railway, VPS, or equivalent.

Database:
- Managed PostgreSQL.

Storage:
- Private object storage.

Domain:
- Custom domain.

Security:
- HTTPS.
- Environment variables.
- Database backups.
- Monitoring.

Provide instructions for local development and production deployment.

Do not expose secret keys in GitHub.

---

# 20. PROJECT DOCUMENTATION

Create the following documentation:

- README.md.
- Architecture documentation.
- Database documentation.
- API documentation.
- Installation guide.
- Environment configuration guide.
- Deployment guide.
- Security documentation.
- Testing guide.
- Development roadmap.

Explain the project in a way that allows another developer to understand, run, test, and contribute to it.

---

# 21. DEVELOPMENT WORKFLOW

Do not generate the entire project in one massive code response.

Work systematically.

PHASE 1:
- Analyze requirements.
- Identify ambiguities.
- Produce architecture.
- Produce ERD.
- Produce project structure.
- Produce implementation roadmap.

PHASE 2:
- Initialize backend.
- Configure FastAPI.
- Configure PostgreSQL.
- Configure SQLAlchemy.
- Configure Alembic.
- Create initial models.
- Create health-check endpoint.

PHASE 3:
- Authentication.
- User management.
- Role-based access control.
- Security implementation.

PHASE 4:
- Rider registration.
- Rider verification.
- Rider availability.

PHASE 5:
- Booking system.
- Fare calculation.
- Booking state transitions.
- Rider matching.

PHASE 6:
- Frontend customer application.
- Frontend rider application.
- API integration.

PHASE 7:
- Admin dashboard.

PHASE 8:
- Maps.
- Location.
- WebSockets.
- Live tracking.

PHASE 9:
- Payments.
- Notifications.

PHASE 10:
- Testing.
- Security review.
- Deployment.
- Documentation.

At the beginning of each phase:

1. Explain the objective.
2. Explain the architecture decisions.
3. Identify files to create or modify.
4. Provide complete code for the required files.
5. Explain where each file belongs.
6. Provide installation or migration commands.
7. Provide testing commands.
8. Verify the expected results.
9. Identify known limitations.
10. Wait for confirmation before moving to the next major phase when working interactively.

Do not skip phases.

Do not silently modify architectural decisions.

If a better technical approach is necessary, explain the reason before implementing it.

---

# 22. CODE QUALITY REQUIREMENTS

All generated code must:

- Be complete.
- Be runnable.
- Follow appropriate Python conventions.
- Use clear naming.
- Include type hints where appropriate.
- Avoid unnecessary duplication.
- Use modular functions.
- Use proper exception handling.
- Avoid hardcoded secrets.
- Avoid fake functionality.
- Avoid placeholder implementations disguised as finished features.
- Include comments where they improve clarity.
- Follow separation of concerns.

Do not give incomplete code such as:

"Add the remaining functions here."

Do not omit imports.

Do not reference files that have not been created.

Do not create frontend controls that do nothing.

If a feature is not implemented, clearly label it as unimplemented.

---

# 23. PRODUCT AND BUSINESS CONSIDERATIONS

The platform must be designed for real operational use.

Consider:

- Rider verification.
- Customer safety.
- Booking disputes.
- Rider cancellations.
- Customer cancellations.
- Fare transparency.
- Lost parcels.
- Delivery confirmation.
- Rider earnings.
- Platform commission.
- Refunds.
- Fraud prevention.
- User privacy.
- Data retention.
- Customer support.
- Emergency reporting.
- Terms of service.
- Privacy policy.

Do not assume that software alone guarantees safety.

Design mechanisms for verification, reporting, accountability, and human intervention.

---

# 24. MVP SUCCESS CRITERIA

The initial MVP is considered functional when:

1. Customers can create accounts.
2. Customers can authenticate securely.
3. Riders can apply.
4. Admins can approve riders.
5. Approved riders can go online.
6. Customers can create ride bookings.
7. Customers can create delivery bookings.
8. The backend calculates estimated fares.
9. Riders can receive booking requests.
10. Riders can accept bookings.
11. Booking status can be updated correctly.
12. Customers can view their bookings.
13. Users cannot access unauthorized records.
14. Admins can manage the platform.
15. Database records persist.
16. The frontend communicates with the real backend.
17. Critical workflows have automated tests.
18. The application can be run locally using documented instructions.

---

# 25. FIRST TASK

Begin by acting as the Senior Software Architect.

Do not start writing the entire codebase immediately.

First deliver:

1. A professional system architecture.
2. A detailed architecture diagram.
3. A database ERD.
4. A complete project directory structure.
5. A list of all backend modules.
6. A list of frontend pages.
7. A complete API endpoint plan.
8. A security architecture.
9. A development roadmap.
10. A list of technical risks and mitigation strategies.
11. Recommended development environment setup for Windows.
12. A realistic MVP scope.




