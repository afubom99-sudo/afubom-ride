# Architecture

The system uses a modular monolith: FastAPI API modules share a PostgreSQL database and can later be separated by domain.

## Core Domains

- Authentication and refresh tokens
- Users and role-based authorization
- Rider applications and verification
- Booking state management
- Backend fare calculation
- Rider matching and availability
- Location tracking
- Payment abstraction
- Notifications
- Administration and audit

## Booking States

`requested -> searching_for_rider -> rider_assigned -> rider_arrived -> in_progress -> completed`

A customer or authorized administrator may cancel eligible active bookings. Completed and cancelled bookings are terminal.

## Fare Engine

Development-only fares use a fixed service base fare, a per-kilometer charge, and a service minimum. Distances use the Haversine formula. The backend is the authority for every estimate and completion fare.

## Scaling

Start with PostgreSQL and the monolith. Add Redis for distributed rate limits and WebSocket coordination as concurrency grows. Move notifications and external callbacks to workers before high-volume operation.
