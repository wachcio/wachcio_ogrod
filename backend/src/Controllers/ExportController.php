<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Db;

// Eksport całych danych użytkownika (ogrody/grządki/nasadzenia + jego własne
// gatunki/odmiany) do jednego JSON-a, do pobrania jako plik i późniejszego
// zaimportowania (patrz ImportController) - kopia zapasowa / przenoszenie danych.
class ExportController
{
    public function export(array $params): void
    {
        $userId = Auth::requireUserId();
        $db = Db::connection();

        $speciesStmt = $db->prepare(
            'SELECT id, name, latin_name, family, spacing_cm, row_spacing_cm, depth_cm, sun_requirement,
                    sow_start_month, sow_end_month, harvest_start_month, harvest_end_month, color
             FROM plant_species WHERE owner_id = ? ORDER BY id'
        );
        $speciesStmt->execute([$userId]);
        $species = $speciesStmt->fetchAll();

        $varietiesStmt = $db->prepare(
            'SELECT v.id, v.species_id, v.name, v.days_to_harvest_min, v.days_to_harvest_max,
                    v.seed_source, v.description, s.owner_id AS species_owner_id, s.name AS species_name
             FROM plant_varieties v
             JOIN plant_species s ON s.id = v.species_id
             WHERE v.owner_id = ? ORDER BY v.id'
        );
        $varietiesStmt->execute([$userId]);
        $varieties = array_map(
            fn (array $row) => [
                'id' => (int) $row['id'],
                'species_ref' => $this->makeRef($row['species_owner_id'], (int) $row['species_id'], $row['species_name']),
                'name' => $row['name'],
                'days_to_harvest_min' => $row['days_to_harvest_min'],
                'days_to_harvest_max' => $row['days_to_harvest_max'],
                'seed_source' => $row['seed_source'],
                'description' => $row['description'],
            ],
            $varietiesStmt->fetchAll()
        );

        $gardensStmt = $db->prepare('SELECT id, name, description FROM gardens WHERE user_id = ? ORDER BY id');
        $gardensStmt->execute([$userId]);

        $gardens = array_map(
            fn (array $garden) => [
                'name' => $garden['name'],
                'description' => $garden['description'],
                'beds' => $this->exportBeds((int) $garden['id']),
            ],
            $gardensStmt->fetchAll()
        );

        header('Content-Disposition: attachment; filename="moj-ogrod-export.json"');
        echo json_encode([
            'version' => 1,
            'exported_at' => gmdate('c'),
            'species' => $species,
            'varieties' => $varieties,
            'gardens' => $gardens,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    private function exportBeds(int $gardenId): array
    {
        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT id, name, width_cm, length_cm, pos_x_cm, pos_y_cm, rotation_deg FROM beds WHERE garden_id = ? ORDER BY id'
        );
        $stmt->execute([$gardenId]);

        return array_map(
            fn (array $bed) => [
                'name' => $bed['name'],
                'width_cm' => $bed['width_cm'],
                'length_cm' => $bed['length_cm'],
                'pos_x_cm' => $bed['pos_x_cm'],
                'pos_y_cm' => $bed['pos_y_cm'],
                'rotation_deg' => $bed['rotation_deg'],
                'plantings' => $this->exportPlantings((int) $bed['id']),
            ],
            $stmt->fetchAll()
        );
    }

    private function exportPlantings(int $bedId): array
    {
        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT p.type, p.x_cm, p.y_cm, p.x2_cm, p.y2_cm, p.spacing_cm, p.planted_date, p.notes,
                    p.species_id, sp.owner_id AS species_owner_id, sp.name AS species_name,
                    p.variety_id, pv.owner_id AS variety_owner_id, pv.name AS variety_name
             FROM plantings p
             JOIN plant_species sp ON sp.id = p.species_id
             LEFT JOIN plant_varieties pv ON pv.id = p.variety_id
             WHERE p.bed_id = ? ORDER BY p.id'
        );
        $stmt->execute([$bedId]);

        return array_map(
            fn (array $row) => [
                'type' => $row['type'],
                'x_cm' => $row['x_cm'],
                'y_cm' => $row['y_cm'],
                'x2_cm' => $row['x2_cm'],
                'y2_cm' => $row['y2_cm'],
                'spacing_cm' => $row['spacing_cm'],
                'planted_date' => $row['planted_date'],
                'notes' => $row['notes'],
                'species_ref' => $this->makeRef($row['species_owner_id'], (int) $row['species_id'], $row['species_name']),
                'variety_ref' => $row['variety_id'] === null
                    ? null
                    : $this->makeRef($row['variety_owner_id'], (int) $row['variety_id'], $row['variety_name']),
            ],
            $stmt->fetchAll()
        );
    }

    // Systemowe gatunki/odmiany (owner_id NULL) mają te same id/nazwy w każdej
    // instalacji (seed z migracji), więc odwołujemy się do nich po nazwie -
    // po imporcie do innej bazy ImportController odnajdzie je z powrotem po
    // nazwie zamiast po id, które w nowej bazie może już nie istnieć.
    private function makeRef(?int $ownerId, int $id, string $name): array
    {
        return $ownerId === null ? ['kind' => 'system', 'name' => $name] : ['kind' => 'owned', 'id' => $id];
    }
}
