# Keycloak local setup

1. Copy `.env.example` to `.env` in the repository root and set a local admin password.
2. Start Keycloak and MongoDB with `docker compose up -d keycloak mongodb`.
3. Open `http://localhost:8180/admin/` and sign in with the admin credentials from `.env`.
4. Docker imports `realm-import/research-platform-realm.json` when Keycloak starts for the first time. The realm is named `research-platform`, the Angular client is `research-platform-frontend`, and self-registration is enabled.
5. If the realm already existed before registration was enabled, turn it on in Keycloak: switch to the `research-platform` realm, open **Realm settings** → **Login**, and enable **User registration**. Keycloak skips realms that already exist during startup import.
6. In one terminal, start the backend from `backend` with `mvnw.cmd spring-boot:run`. In another, start the frontend from `frontend` with `npm ci` followed by `npm start`.
7. Open `http://localhost:4200`, choose **Create an account**, and complete the registration form on Keycloak. After registration, Keycloak returns you to the experiments page.

The admin account is only for managing Keycloak. Application users sign in through the `research-platform` realm. Do not use the development Keycloak settings for a public or production deployment.
