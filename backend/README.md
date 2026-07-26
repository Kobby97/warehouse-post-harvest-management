# GrainGuard Backend

IoT-based Warehouse Post-Harvest Silo Management System — backend service.

Monitors grain silos via ESP32 sensor devices, evaluates readings against
configurable thresholds, raises alerts, and logs automated ventilation
decisions. Consumed by a React frontend.

**Status:** Milestone M2 — JWT authentication complete. Real security is now enforced.

## Stack

- Java 21
- Spring Boot 3
- Maven
- MySQL 8
- Spring Data JPA / Hibernate
- Spring Security + JWT (auth not yet implemented — see M2)
- Flyway (schema migrations)
- Lombok
- springdoc-openapi (Swagger UI)

## Prerequisites

- JDK 21
- Docker + Docker Compose (for local MySQL)
- Maven itself is **not required** — this project includes the Maven
  Wrapper (`mvnw` / `mvnw.cmd`), which downloads the correct pinned Maven
  version automatically on first run. Always use `./mvnw` (or `mvnw.cmd`
  on Windows) instead of a globally-installed `mvn`, so every teammate is
  guaranteed to build with the same Maven version regardless of what's on
  their machine.

## Running locally

1. Start MySQL:

   ```bash
   docker compose up -d
   ```

2. (Optional) Copy `.env.example` to `.env` and adjust values. Defaults
   already match `docker-compose.yml`, so this is optional for local dev.

3. Run the app:

   ```bash
   ./mvnw spring-boot:run
   ```

   (Windows: `mvnw.cmd spring-boot:run`)

   First run will take a minute — it downloads the pinned Maven
   distribution and all project dependencies. Subsequent runs are fast.

4. Verify it's alive:

   - Ping check: http://localhost:8080/api/v1/ping
   - Swagger UI: http://localhost:8080/swagger-ui.html
   - Health: http://localhost:8080/actuator/health

On first run, Flyway will apply `V1__baseline.sql` automatically — check
the startup logs for `Successfully applied 1 migration`.

## Project status / important notes

- **Real JWT authentication is now enforced** (`SecurityConfig.java`). All
  endpoints require a valid `Authorization: Bearer <token>` header except
  `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/ping`, and the
  Swagger UI paths. Get a token via `POST /api/v1/auth/register` or
  `POST /api/v1/auth/login`, then click "Authorize" in Swagger UI (or add
  the header manually in Postman) to call protected endpoints.
- Role assignment at registration is intentionally open (the caller picks
  `ADMIN`/`MANAGER`/`VIEWER` in the request body) — there's no existing
  Admin yet to gate account creation otherwise. This is a documented
  simplification for capstone purposes; a stricter production setup would
  default new accounts to `VIEWER` and require an existing Admin to grant
  higher roles.
- `spring.jpa.hibernate.ddl-auto` is set to `validate`, never `update` or
  `create`. **Flyway owns the schema.** All schema changes must be made via
  a new file in `src/main/resources/db/migration/`, following the naming
  convention `V{n}__description.sql`. Never edit an already-applied
  migration file — add a new one.

## Roadmap

See project documentation (`docs/`) for the full milestone breakdown
(M0–M9). Current milestone: **M0 — Project Foundation & Environment Setup**.

## Team conventions

- Branching: feature branches off `develop`, PR into `develop`, `main`
  reserved for stable/demo-ready states.
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`,
  `test:`).
- Package-by-feature structure under `com.grainguard.backend` — see
  architecture docs for the full package layout.
