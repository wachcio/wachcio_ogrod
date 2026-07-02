<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Db;
use PDO;
use Throwable;

// Import pliku wyeksportowanego przez ExportController. Zawsze *dokłada*
// nowe rekordy do konta aktualnie zalogowanego użytkownika (nie nadpisuje
// ani nie scala z istniejącymi danymi) - importowanie tego samego pliku
// dwa razy po prostu podwoi dane, co jest świadomym uproszczeniem.
class ImportController
{
    /** @var array<int, int> stare id gatunku (z pliku) => nowe id w bazie */
    private array $speciesIdMap = [];

    /** @var array<int, int> stare id odmiany (z pliku) => nowe id w bazie */
    private array $varietyIdMap = [];

    public function import(array $params): void
    {
        $userId = Auth::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data)) {
            http_response_code(422);
            echo json_encode(['error' => 'Nieprawidłowy plik JSON']);
            return;
        }

        $species = is_array($data['species'] ?? null) ? $data['species'] : [];
        $varieties = is_array($data['varieties'] ?? null) ? $data['varieties'] : [];
        $gardens = is_array($data['gardens'] ?? null) ? $data['gardens'] : [];

        $db = Db::connection();
        $db->beginTransaction();

        try {
            foreach ($species as $row) {
                $this->importSpecies($db, $userId, $row);
            }

            foreach ($varieties as $row) {
                $this->importVariety($db, $userId, $row);
            }

            $bedCount = 0;
            $plantingCount = 0;
            foreach ($gardens as $gardenRow) {
                $gardenId = $this->importGarden($db, $userId, $gardenRow);
                foreach ((is_array($gardenRow['beds'] ?? null) ? $gardenRow['beds'] : []) as $bedRow) {
                    $bedId = $this->importBed($db, $gardenId, $bedRow);
                    $bedCount++;
                    foreach ((is_array($bedRow['plantings'] ?? null) ? $bedRow['plantings'] : []) as $plantingRow) {
                        $this->importPlanting($db, $bedId, $plantingRow);
                        $plantingCount++;
                    }
                }
            }

            $db->commit();

            echo json_encode(['imported' => [
                'species' => count($this->speciesIdMap),
                'varieties' => count($this->varietyIdMap),
                'gardens' => count($gardens),
                'beds' => $bedCount,
                'plantings' => $plantingCount,
            ]]);
        } catch (Throwable) {
            $db->rollBack();
            http_response_code(422);
            echo json_encode(['error' => 'Nie udało się zaimportować pliku - sprawdź, czy to poprawny eksport z tej aplikacji']);
        }
    }

    private function importSpecies(PDO $db, int $userId, mixed $row): void
    {
        if (!is_array($row) || !isset($row['id'], $row['name'])) {
            throw new \RuntimeException('Brak wymaganych pól gatunku');
        }

        $stmt = $db->prepare(
            'INSERT INTO plant_species
                (owner_id, name, latin_name, family, spacing_cm, row_spacing_cm, depth_cm, sun_requirement,
                 sow_start_month, sow_end_month, harvest_start_month, harvest_end_month, color)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            (string) $row['name'],
            $row['latin_name'] ?? null,
            $row['family'] ?? null,
            $row['spacing_cm'] ?? null,
            $row['row_spacing_cm'] ?? null,
            $row['depth_cm'] ?? null,
            $row['sun_requirement'] ?? null,
            $row['sow_start_month'] ?? null,
            $row['sow_end_month'] ?? null,
            $row['harvest_start_month'] ?? null,
            $row['harvest_end_month'] ?? null,
            $row['color'] ?? '#4caf50',
        ]);

        $this->speciesIdMap[(int) $row['id']] = (int) $db->lastInsertId();
    }

    private function importVariety(PDO $db, int $userId, mixed $row): void
    {
        if (!is_array($row) || !isset($row['id'], $row['name'])) {
            throw new \RuntimeException('Brak wymaganych pól odmiany');
        }

        $speciesId = $this->resolveRef($db, $row['species_ref'] ?? null, $this->speciesIdMap, 'plant_species');
        if ($speciesId === null) {
            // Gatunek, do którego należy ta odmiana, nie istnieje ani w pliku,
            // ani wśród gatunków systemowych tej instalacji - pomijamy odmianę
            // zamiast przerywać cały import.
            return;
        }

        $stmt = $db->prepare(
            'INSERT INTO plant_varieties (species_id, owner_id, name, days_to_harvest_min, days_to_harvest_max, seed_source, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $speciesId,
            $userId,
            (string) $row['name'],
            $row['days_to_harvest_min'] ?? null,
            $row['days_to_harvest_max'] ?? null,
            $row['seed_source'] ?? null,
            $row['description'] ?? null,
        ]);

        $this->varietyIdMap[(int) $row['id']] = (int) $db->lastInsertId();
    }

    private function importGarden(PDO $db, int $userId, mixed $row): int
    {
        if (!is_array($row) || !isset($row['name'])) {
            throw new \RuntimeException('Brak wymaganych pól ogrodu');
        }

        $stmt = $db->prepare('INSERT INTO gardens (user_id, name, description) VALUES (?, ?, ?)');
        $stmt->execute([$userId, (string) $row['name'], $row['description'] ?? null]);

        return (int) $db->lastInsertId();
    }

    private function importBed(PDO $db, int $gardenId, mixed $row): int
    {
        if (!is_array($row) || !isset($row['name'], $row['width_cm'], $row['length_cm'])) {
            throw new \RuntimeException('Brak wymaganych pól grządki');
        }

        $stmt = $db->prepare(
            'INSERT INTO beds (garden_id, name, width_cm, length_cm, pos_x_cm, pos_y_cm, rotation_deg)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $gardenId,
            (string) $row['name'],
            $row['width_cm'],
            $row['length_cm'],
            $row['pos_x_cm'] ?? 0,
            $row['pos_y_cm'] ?? 0,
            $row['rotation_deg'] ?? 0,
        ]);

        return (int) $db->lastInsertId();
    }

    private function importPlanting(PDO $db, int $bedId, mixed $row): void
    {
        if (!is_array($row) || !isset($row['type'], $row['x_cm'], $row['y_cm'])) {
            throw new \RuntimeException('Brak wymaganych pól nasadzenia');
        }

        $speciesId = $this->resolveRef($db, $row['species_ref'] ?? null, $this->speciesIdMap, 'plant_species');
        if ($speciesId === null) {
            // Podobnie jak przy odmianach - jeśli gatunek nasadzenia nie da
            // się odtworzyć, pomijamy samo nasadzenie zamiast całego importu.
            return;
        }

        $varietyRef = $row['variety_ref'] ?? null;
        $varietyId = $varietyRef === null
            ? null
            : $this->resolveRef($db, $varietyRef, $this->varietyIdMap, 'plant_varieties');

        $stmt = $db->prepare(
            'INSERT INTO plantings (bed_id, species_id, variety_id, type, x_cm, y_cm, x2_cm, y2_cm, spacing_cm, planted_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $bedId,
            $speciesId,
            $varietyId,
            (string) $row['type'],
            $row['x_cm'],
            $row['y_cm'],
            $row['x2_cm'] ?? null,
            $row['y2_cm'] ?? null,
            $row['spacing_cm'] ?? null,
            $row['planted_date'] ?? null,
            $row['notes'] ?? null,
        ]);
    }

    // Odwołanie ("ref") z pliku to albo {kind: "owned", id} - wskazuje na
    // wiersz z tego samego pliku, remapowany przez $idMap na nowo nadane id,
    // albo {kind: "system", name} - wskazuje na współdzielony wiersz
    // (owner_id NULL) odnajdywany po nazwie w bieżącej instalacji.
    /** @param array<int, int> $idMap */
    private function resolveRef(PDO $db, mixed $ref, array $idMap, string $table): ?int
    {
        if (!is_array($ref) || !isset($ref['kind'])) {
            return null;
        }

        if ($ref['kind'] === 'owned' && isset($ref['id'])) {
            return $idMap[(int) $ref['id']] ?? null;
        }

        if ($ref['kind'] === 'system' && isset($ref['name'])) {
            $stmt = $db->prepare("SELECT id FROM {$table} WHERE owner_id IS NULL AND name = ? LIMIT 1");
            $stmt->execute([(string) $ref['name']]);
            $id = $stmt->fetchColumn();
            return $id === false ? null : (int) $id;
        }

        return null;
    }
}
