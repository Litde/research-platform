# Keycloak local setup

1. Copy `.env` to `.env` in the repository root and set a local admin password.
2. Start Keycloak and MongoDB with `docker compose up -d keycloak mongodb`.
3. Open `http://localhost:8180/admin/` and sign in with the admin credentials from `.env`.
4. Docker imports `realm-import/research-platform-realm.json` when Keycloak starts for the first time. The realm is named `research-platform` and the Angular client is `research-platform-frontend`.
5. In the admin console, switch to the `research-platform` realm, open **Users**, choose **Add user**, and create a user. Open that user’s **Credentials** tab, set a password, and turn **Temporary** off for a local test account.
6. In one terminal, start the backend from `backend` with `mvnw.cmd spring-boot:run`. In another, start the frontend from `frontend` with `npm ci` followed by `npm start`.
7. Open `http://localhost:4200`, choose **Log in**, and sign in with the user created above.

The admin account is only for managing Keycloak. Application users sign in through the `research-platform` realm. Do not use the development Keycloak settings for a public or production deployment.
