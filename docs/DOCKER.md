# Uruchamianie całego Research Platform przez Docker

Projekt składa się z osobnych kontenerów spiętych przez Docker Compose: Angular, Spring Boot, MongoDB, Keycloak i RabbitMQ. Dane MongoDB, Keycloak i RabbitMQ są przechowywane w nazwanych wolumenach, więc zwykłe zatrzymanie kontenerów nie usuwa bazy ani kont.

Przy pierwszym uruchomieniu pustej bazy Compose dodaje 6 przykładowych eksperymentów i 48 uruchomień. Seed nie usuwa ani nie nadpisuje istniejących danych. Reset lub rozszerzenie zestawu opisuje [DEMO_GUIDE.md](DEMO_GUIDE.md).

## Wymagania

- Docker Desktop z uruchomionym silnikiem Docker.
- Lokalny plik `.env` w głównym katalogu projektu. Skopiuj `.env.example` do `.env` i ustaw lokalne hasło administratora Keycloak. Plik `.env` z sekretami jest ignorowany przez Git.

W PowerShell przygotujesz plik poleceniem:

```powershell
Copy-Item .env.example .env
```

Następnie otwórz `.env` i zmień `KEYCLOAK_ADMIN_PASSWORD`. Przykładowe zmienne:

```dotenv
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=ustaw-lokalne-haslo
RABBITMQ_USERNAME=research
RABBITMQ_PASSWORD=research-dev-password
SIMULATION_DEMO_DELAY_MS=10000
```

Nie commituj `.env` ani prawdziwych haseł.

## Start

W PowerShell, z katalogu głównego repozytorium:

```powershell
docker compose up --build -d
```

Pierwszy start pobiera obrazy i buduje aplikacje, więc może potrwać kilka minut. Status usług sprawdzisz poleceniem:

```powershell
docker compose ps
```

Po uruchomieniu otwórz:

- Frontend: http://localhost:4200
- Keycloak: http://localhost:8180
- Backend health: http://localhost:8080/api/health
- RabbitMQ management: http://localhost:15672

Zaloguj się do aplikacji przez Keycloak. Dane demonstracyjne administratora Keycloak to wartości z `.env`; użytkowników aplikacji zakłada się przez formularz rejestracji Keycloak.

## Logi i zatrzymanie

```powershell
docker compose logs -f backend
docker compose logs -f keycloak
docker compose down
```

`docker compose down` zatrzymuje i usuwa kontenery, ale zachowuje wolumeny z danymi. Aby usunąć również całą lokalną bazę, stan Keycloak i dane RabbitMQ, użyj `docker compose down -v`. To polecenie jest destrukcyjne i nie jest potrzebne przy zwykłym restarcie.

### Aktualizacja z poprzedniego Compose

Poprzednia konfiguracja RabbitMQ mogła mieć już wolumen z domyślnym użytkownikiem `guest`. Nowy backend łączy się jako `research` (lub wartości z `.env`). Jeżeli kontener RabbitMQ korzysta ze starego wolumenu, po starcie utwórz użytkownika odpowiadającego wartościom z `.env` i nadaj mu uprawnienia:

```powershell
docker exec -it research-platform-rabbitmq rabbitmqctl add_user research research-dev-password
docker exec -it research-platform-rabbitmq rabbitmqctl set_permissions -p / research ".*" ".*" ".*"
```

Powyższe komendy używają wartości domyślnych Compose. Jeśli masz inne `RABBITMQ_USERNAME` lub `RABBITMQ_PASSWORD` w `.env`, podstaw je w obu poleceniach. Jeśli użytkownik już istnieje, zamiast `add_user` wykonaj `rabbitmqctl change_password research research-dev-password`.

Nowa konfiguracja przechowuje dane Keycloak w wolumenie `keycloak_data`. Poprzednia konfiguracja nie miała takiego wolumenu, więc konta utworzone wyłącznie w starym kontenerze Keycloak mogą nie zostać przeniesione przy jego odtworzeniu. Jeśli chcesz zachować istniejących użytkowników, wyeksportuj realm z konsoli administracyjnej przed pierwszym `docker compose up --build -d`; realm projektu zostanie zaimportowany z `keycloak/realm-import`.

## Jak działa Keycloak w sieci kontenerów

Przeglądarka korzysta z adresu `http://localhost:8180`, który jest też wystawcą tokenów. Backend waliduje ten sam issuer, ale pobiera klucze publiczne przez wewnętrzny adres Compose `http://keycloak:8080`. Dzięki temu nazwa sieciowa kontenera nie zmienia `iss` tokenu. MongoDB i RabbitMQ są osiągalne dla backendu pod nazwami usług `mongodb` i `rabbitmq`.

Frontend jest serwowany przez Nginx na porcie 4200, z fallbackiem do `index.html`, więc odświeżanie tras Angulara działa również po wejściu bezpośrednio na `/explore`.
