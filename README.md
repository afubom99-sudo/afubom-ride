# Afubom ride

A modular FastAPI and PostgreSQL platform for motorcycle transportation and local delivery in Bamenda, Cameroon.

## MVP Features

- Customer and rider account registration
- Argon2 passwords and JWT authentication
- Rider applications and admin approval
- Backend-controlled XAF fare estimates
- Idempotent booking creation
- Concurrency-aware rider assignment
- Booking state transitions and owner-level authorization
- Rider availability and location recording
- Customer, rider, and admin interfaces

## Local Development

### Windows PowerShell

```powershell
cd backend
py -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000`.

The default SQLite database is suitable for local development. Use PostgreSQL for production.

### Docker Compose

Run Compose from the workspace root:

```powershell
cd backend
Copy-Item .env.example .env
docker compose up --build
```

Open `http://127.0.0.1:8000`.

### Bootstrap an administrator

Set `BOOTSTRAP_ADMIN_PHONE` and `BOOTSTRAP_ADMIN_PASSWORD` in the environment, then run:

```powershell
cd backend
python -m app.bootstrap_admin
```

Use a unique password of at least 12 characters. Remove or securely protect bootstrap variables after provisioning.

## Tests

```powershell
cd backend
python -m pytest -q
```

## API Documentation

Open `http://127.0.0.1:8000/docs` for interactive OpenAPI documentation.

## Bamenda Map and Street Search

The booking form searches map-provider data for Bamenda streets, neighborhoods, and landmarks; it does not rely on a manually maintained street list. Search is biased to Bamenda and Cameroon. Users may also choose points on the map, use their current location after granting browser permission, or enter coordinates manually.

- By default, the map uses Leaflet with OpenStreetMap street tiles and Esri World Imagery for satellite view; required map attribution is displayed. Search terms are sent to the public Photon service. These external map and geocoding endpoints are best-effort, not an SLA-backed production service. Review provider terms for production traffic and configure commercial or hosted providers as needed.
- After pickup and destination are selected, the map traces a driving route with the public OSRM demo service using OpenStreetMap road data. Route geometry and travel time are estimates; the demo service is best-effort and should be replaced with a dedicated routing provider for production traffic.
- To use Google Maps and Google Places, set `GOOGLE_MAPS_BROWSER_KEY` in `backend/.env`. Enable Maps JavaScript API and Places API and configure billing in Google Cloud. The map view switch uses Google Maps' roadmap and satellite types. The browser key is necessarily visible to users; restrict it by website referrer and API allowlist. Do not use a server API key here.
- No provider can guarantee a complete list of every street or informal local landmark. Place coverage and spelling may vary. Users can select a point directly or enter coordinates when a match is missing.
- Browser geolocation requires the user’s permission and a secure context (HTTPS in production; localhost is allowed for development).

## Security Notes

- Set a strong unique `JWT_SECRET` in production.
- Use HTTPS and a restricted CORS origin list.
- Do not commit `.env` files or payment credentials.
- Use managed PostgreSQL and private object storage for rider documents.
- The test fare values are development prices and must be replaced after business approval.
