# Dane demonstracyjne

Projekt przygotowuje przykładowe dane automatycznie przy pierwszym uruchomieniu `docker compose up --build -d`, jeśli kolekcje `experiments` i `experiment_runs` są puste. Tworzy 6 publicznych eksperymentów i 48 przykładowych zakończonych uruchomień z datami z kilku tygodni. Dane pozwalają pokazać listę eksperymentów, tygodniowy wykres metryk i wykres oszacowania π względem liczby próbek.

Zestaw obejmuje badanie zbieżności, porównanie czasu wykonania, symulacje o dużej liczbie próbek, drabinę dokładności, profil przepustowości i powtarzalność prób. Wszystkie przykłady korzystają z aktualnie zaimplementowanej symulacji Monte Carlo π, ale pokazują różne metryki i scenariusze prezentacyjne.

Skrypty znajdują się w katalogu `scripts/`:

- `seed-demo-data.js` dodaje przykładowe dane wyłącznie wtedy, gdy obie kolekcje są puste. Nie modyfikuje istniejących danych.
- `extend-demo-data.js` dodaje brakujące przykłady bez kasowania istniejących dokumentów; kolejne uruchomienie nie tworzy duplikatów.
- `reset-demo-data.js` usuwa dokumenty tylko z `experiment_runs` i `experiments`, po czym dodaje nowy zestaw demonstracyjny.

## Uruchomienie całego projektu

W głównym katalogu repozytorium, w PowerShell:

```powershell
docker compose up --build -d
```

Po starcie otwórz http://localhost:4200 i zaloguj się. Backend czeka, aż MongoDB będzie gotowe i skrypt seedowania zakończy pracę. Dane utworzone przez skrypt są publicznie widoczne dla zalogowanych użytkowników, ale nieedytowalne dla zwykłych użytkowników.

## Wyczyść i odtwórz dane demonstracyjne

To polecenie jest przeznaczone do lokalnej bazy demonstracyjnej. Usuwa całą historię symulacji i wszystkie eksperymenty, a następnie wstawia nowy zestaw. Nie usuwa użytkowników Keycloak ani danych RabbitMQ.

```powershell
docker compose --profile maintenance run --rm demo-reset
```

Jeśli chcesz tylko dodać brakujące przykłady bez czyszczenia własnych danych, użyj:

```powershell
docker compose --profile maintenance run --rm demo-extend
```

Możesz sprawdzić liczbę rekordów poleceniem:

```powershell
docker exec -it research-platform-mongodb mongosh research_platform --quiet --eval "print('experiments=' + db.experiments.countDocuments()); print('experiment_runs=' + db.experiment_runs.countDocuments())"
```

Powinno wyświetlić `experiments=6` i `experiment_runs=48` po pełnym reseedzie.

## Zachowanie danych

`docker compose down` zachowuje wolumen MongoDB. Ponowne uruchomienie nie usuwa danych. Skrypt automatyczny pominie seedowanie, jeśli choć jedna z dwóch kolekcji zawiera dokumenty. Użyj `demo-reset`, gdy chcesz celowo wrócić do czystego zestawu prezentacyjnego. Nie używaj `docker compose down -v`, jeśli chcesz zachować dane lub konta Keycloak.

Przykładowe uruchomienia są syntetycznymi danymi demonstracyjnymi, a nie wynikami wykonanych obliczeń Monte Carlo. Rzeczywiste uruchomienia nadal można dodawać przyciskiem **Simulate** w aplikacji.
