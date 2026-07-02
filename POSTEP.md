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

## Do zrobienia (kolejne kamienie milowe)

4. Sąsiedztwo roślin (companion planting) — ostrzeżenia o dobrym/złym sąsiedztwie
5. Notatki i zdjęcia przy grządce/roślinie
6. Kalendarz siewu/zbiorów
7. Eksport/import danych (JSON, PDF/obraz planu)
8. Dopracowanie responsywności mobilnej

## Znane ograniczenia środowiska pracy

Środowisko, w którym pracuje Claude, nie ma zainstalowanego Dockera/PHP/MySQL — backend i całość na żywo może przetestować tylko użytkownik na swojej maszynie. Claude weryfikuje to, co się da lokalnie (kompilacja TypeScript, build frontendu, ręczny przegląd kodu PHP).
