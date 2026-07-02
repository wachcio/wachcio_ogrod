# Postęp prac — Mój ogród

Ten plik to dziennik postępu projektu, aktualizowany na bieżąco, żeby można było wrócić do pracy w dowolnym momencie (nawet w nowej sesji Claude) i wiedzieć, co już działa, a co jest w budowie.

Pełny plan architektury (schemat bazy, API, kolejne kamienie milowe) jest w `/home/wachcio/.claude/plans/quirky-chasing-hoare.md`.

## Stack

- **Frontend**: React + TypeScript + Vite, routing przez `react-router-dom`, wizualizacja w SVG (skala 1 jednostka viewBox = 1 cm)
- **Backend**: czysty PHP (własny mini-router, bez frameworka), PDO + MySQL/MariaDB, sesyjne logowanie
- **Baza**: MySQL/MariaDB, migracje SQL w `backend/src/migrations/` (numerowane, uruchamiane automatycznie przy pierwszym starcie kontenera `db`)
- **Uruchamianie**: `docker compose up --build` (kontenery: `db`, `backend` :8080, `frontend` :5173, `phpmyadmin` :8081)
- **Repo**: git zainicjowany lokalnie, remote `https://github.com/wachcio/wachcio_ogrod.git` dodany, **nic jeszcze nie wypchnięte** (push tylko na wyraźną prośbę)

## Jak uruchomić

```
docker compose up --build
```

Otwórz `http://localhost:5173`. Plik `.env` (hasła do bazy) już istnieje lokalnie z przykładowymi wartościami z `.env.example` — warto zmienić przed dalszą pracą.

**Uwaga**: jeśli dodałem nowe migracje SQL do `backend/src/migrations/`, a baza już wcześniej istniała (kontener `db` był uruchamiany), MariaDB **nie** uruchomi ich automatycznie — pliki init odpalają się tylko przy pustym wolumenie danych. W takiej sytuacji trzeba zrobić `docker compose down -v && docker compose up --build` (kasuje dane w bazie) albo ręcznie odpalić nowy plik `.sql` przez phpMyAdmin/klienta mysql.

## Zrobione

### Milestone 1 — fundament (commit `c367ce4`)
- Docker Compose, PHP + Apache, MariaDB, Vite dev server, phpMyAdmin
- Logowanie sesyjne (rejestracja/logowanie/wylogowanie), wielu użytkowników z własnymi ogrodami
- CRUD ogrodów i grządek (wymiary, pozycja)
- Wizualizacja ogrodu jako SVG w skali rzeczywistej (`GardenCanvas`)
- **Potwierdzone przez użytkownika jako działające** (2026-07-02)

### Milestone 2 — biblioteka roślin i sadzenie (commit `5b1038e`)
- Tabele `plant_species`, `plant_varieties`, `plantings` + seed ~12 popularnych warzyw z odmianami
- Biblioteka roślin (`/species`): przeglądanie gatunków systemowych + własnych, dodawanie własnych gatunków/odmian
- Widok grządki (`/gardens/:id/beds/:bedId`) z klikalnym planem SVG — sadzenie punktowe i rzędowe przez wskazanie miejsca na planie, wybór gatunku + odmiany
- **Niepotwierdzone jeszcze przez użytkownika w przeglądarce** — patrz uwaga o migracjach wyżej (trzeba zresetować wolumen bazy, żeby nowe tabele się utworzyły)

### Milestone 3 — rotacja upraw (commit jeszcze nie utworzony w tej sesji)
- Ostrzeżenia o płodozmianie: przy dodawaniu nasadzenia backend sprawdza, czy na tej samej grządce w ciągu ostatnich 24 miesięcy rosła już roślina z tej samej rodziny botanicznej (`plant_species.family`) i zwraca ostrzeżenie (nieblokujące) w odpowiedzi (`PlantingController::checkRotationWarning`)
- Uproszczenie względem pierwotnego planu: zrezygnowałem z osobnej tabeli `seasons` na rzecz korzystania z istniejącego pola `planted_date` — mniej encji do zarządzania w UI, ta sama wartość funkcjonalna
- Frontend: baner z ostrzeżeniem po dodaniu nasadzenia (możliwy do zamknięcia) + sekcja "Historia grządki" grupująca nasadzenia wg roku (`groupByYear` w `BedDetailPage.tsx`)
- Nowa migracja `004_planting_indexes.sql` (indeks pod zapytania rotacji) — **też wymaga resetu wolumenu bazy** jak migracje z Milestone 2, jeśli baza już istnieje

### Drobne usprawnienia — linijka z wymiarami i wyrównanie gatunków systemowych/własnych (commit `9852e27`)
- `PlantingCanvas`: dodano `RulerAxes` (`frontend/src/components/RulerAxes.tsx`) — podziałka co 25 cm wzdłuż górnej i lewej krawędzi grządki, żeby łatwiej było trafiać w konkretne miejsce podczas sadzenia bez liczenia kratek siatki. Dodatkowo podczas rysowania rzędu (przed zapisaniem) pokazuje się na bieżąco długość rzędu w cm nad prowadnicą.
- `PlantingForm`: po wyborze gatunku pole "odstęp w rzędzie" podpowiada się z `species.spacing_cm` (wcześniej był zawsze sztywny domyślny 30 cm, niezależnie od gatunku) — nadal można je ręcznie zmienić.
- **Naprawiony błąd**: formularze "Dodaj własny gatunek"/"Dodaj odmianę" (`SpeciesLibraryPage.tsx`, `SpeciesCard.tsx`) wysyłały do backendu tylko `name`+`color` (gatunek) / samo `name` (odmiana), mimo że backend i baza obsługują pełny komplet pól. Efekt: gatunki/odmiany systemowe (z seeda) miały komplet szczegółów (rozstaw, głębokość siewu, stanowisko, miesiące siewu/zbioru, czas do zbioru, źródło nasion, opis), a własne dodane przez użytkownika były "ubogie" — te pola zawsze wychodziły `NULL`. Teraz oba formularze zbierają ten sam komplet opcjonalnych pól co dane systemowe. Przy okazji lista odmian pokazuje też te szczegóły (wcześniej UI wyświetlał tylko nazwę odmiany, nawet dla odmian systemowych, które już miały te dane w bazie).
- Zmiany czysto frontendowe (backend PHP już wcześniej przyjmował te pola) — nie wymaga resetu bazy ani nowej migracji.

### Domyślny rozmiar grządki, pozycja kursora, dymek z detalami rośliny (commit `d7f5b33`)
- Domyślne wymiary nowej grządki w `BedForm` to teraz 100×200cm (wcześniej 100×100cm).
- `PlantingCanvas` pokazuje krzyżyk z aktualną pozycją kursora (w cm) podczas sadzenia — działa razem z linijką `RulerAxes`.
- Najechanie na posadzoną roślinkę pokazuje własny dymek ze szczegółami (odmiana, rodzina botaniczna, odstęp w rzędzie, data posadzenia, notatka) zamiast wcześniejszej natywnej etykiety przeglądarki z samą nazwą gatunku.
- Też zmiany czysto frontendowe, bez migracji.

### Eksport / import danych do JSON (commit jeszcze nie utworzony w tej sesji)
- Nowy `GET /api/export` (`backend/src/Controllers/ExportController.php`) zwraca cały komplet danych zalogowanego użytkownika: jego ogrody → grządki → nasadzenia, oraz jego własne gatunki/odmiany (systemowych, współdzielonych `owner_id IS NULL`, celowo nie eksportujemy — odtwarzają się z seeda w każdej instalacji).
- Nowy `POST /api/import` (`backend/src/Controllers/ImportController.php`) przyjmuje ten sam JSON i **dokłada** dane do konta aktualnie zalogowanego użytkownika w jednej transakcji PDO (pierwsze użycie transakcji w tym backendzie) — nie nadpisuje ani nie scala z istniejącymi danymi, więc powtórny import tego samego pliku podwoi dane (świadome uproszczenie, brak wykrywania duplikatów).
- Odwołania do gatunku/odmiany przy nasadzeniu/odmianie eksportowane są jako `{kind: "owned", id}` (odtwarzane przez mapowanie starych id z pliku na nowo nadane id przy imporcie) albo `{kind: "system", name}` (odnajdywane po nazwie w bazie docelowej, bo systemowe id z seeda nie muszą się zgadzać między instalacjami) — to jedyny nietrywialny element importu.
- Frontend: nowa strona `/dane` (`frontend/src/features/data/DataPage.tsx`, link z `GardensListPage`) — przycisk "Pobierz plik JSON" buduje Blob i pobiera plik w przeglądarce (bez zmian w `api/client.ts`, bo eksport to zwykły JSON), oraz `<input type="file">` do importu z potwierdzeniem przed wysłaniem i podsumowaniem liczby zaimportowanych rekordów.
- Bez nowej migracji SQL — korzysta z istniejącego schematu.

### Jednolite kropki, podświetlanie z historii, edycja nasadzenia (commit jeszcze nie utworzony w tej sesji)
- `PlantingCanvas`: punkt i kropki rzędu mają teraz ten sam promień (`DOT_RADIUS = 2`) — wcześniej punkt (r=2.5) był zauważalnie większy niż kropki w rzędzie (r=2).
- Najechanie myszą na pozycję w "Historia grządki" (`BedDetailPage.tsx`) podświetla odpowiadające jej nasadzenie na planie SVG (pierścień wokół kropki/pogrubiona linia rzędu, kolor `--accent`) — nowy prop `highlightedId` na `PlantingCanvas`.
- Nowy przycisk "Edytuj" przy każdym nasadzeniu w historii otwiera `PlantingForm` w trybie edycji (nowy opcjonalny prop `initialPlanting`, ten sam formularz co przy dodawaniu — analogicznie do `BedForm`/`initialBed`). Edycja zmienia gatunek/odmianę/odstęp/datę/notatkę, ale nie geometrię (przesunięcie = usuń i dodaj ponownie, bo nie ma jeszcze przeciągania na canvasie).
- Backend: nowy `PUT /api/plantings/{id}` (`PlantingController::update`).
- Bez nowej migracji SQL.

## Do zrobienia (kolejne kamienie milowe)

4. Sąsiedztwo roślin (companion planting) — ostrzeżenia o dobrym/złym sąsiedztwie
5. Notatki i zdjęcia przy grządce/roślinie
6. Kalendarz siewu/zbiorów
7. Eksport/import planu jako PDF/obraz (JSON już zrobiony — patrz wyżej)
8. Dopracowanie responsywności mobilnej

## Znane ograniczenia środowiska pracy

Środowisko, w którym pracuje Claude, nie ma zainstalowanego Dockera/PHP/MySQL — backend i całość na żywo może przetestować tylko użytkownik na swojej maszynie. Claude weryfikuje to, co się da lokalnie (kompilacja TypeScript, build frontendu, ręczny przegląd kodu PHP).
