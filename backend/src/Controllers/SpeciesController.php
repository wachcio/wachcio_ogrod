<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Db;
use Throwable;

// Gatunki dzielą się na "systemowe" (owner_id NULL, wspólna biblioteka
// startowa z migracji, tylko do odczytu) i "własne" użytkownika
// (owner_id = jego id, może je edytować/usuwać).
class SpeciesController
{
    public function index(array $params): void
    {
        $userId = Auth::requireUserId();
        $db = Db::connection();

        // planting_count - ile nasadzeń na grządkach używa tego gatunku - żeby
        // frontend mógł pokazać ostrzeżenie przed usunięciem, ile nasadzeń
        // zniknie razem z gatunkiem (species_id w plantings jest NOT NULL,
        // więc usunięcie gatunku zawsze kasuje też te nasadzenia - patrz destroy()).
        $stmt = $db->prepare(
            'SELECT s.*, (SELECT COUNT(*) FROM plantings p WHERE p.species_id = s.id) AS planting_count
             FROM plant_species s
             WHERE s.owner_id IS NULL OR s.owner_id = ?
             ORDER BY s.name'
        );
        $stmt->execute([$userId]);

        echo json_encode(['species' => $stmt->fetchAll()]);
    }

    public function create(array $params): void
    {
        $userId = Auth::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            http_response_code(422);
            echo json_encode(['error' => 'Nazwa gatunku jest wymagana']);
            return;
        }

        $sunRequirement = $data['sun_requirement'] ?? null;
        if ($sunRequirement !== null && !in_array($sunRequirement, ['sun', 'partial_shade', 'shade'], true)) {
            http_response_code(422);
            echo json_encode(['error' => 'Nieprawidłowa wartość sun_requirement']);
            return;
        }

        $db = Db::connection();
        $stmt = $db->prepare(
            'INSERT INTO plant_species
                (owner_id, name, latin_name, family, spacing_cm, row_spacing_cm, depth_cm, sun_requirement,
                 sow_start_month, sow_end_month, harvest_start_month, harvest_end_month, color)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $name,
            $data['latin_name'] ?? null,
            $data['family'] ?? null,
            $data['spacing_cm'] ?? null,
            $data['row_spacing_cm'] ?? null,
            $data['depth_cm'] ?? null,
            $sunRequirement,
            $data['sow_start_month'] ?? null,
            $data['sow_end_month'] ?? null,
            $data['harvest_start_month'] ?? null,
            $data['harvest_end_month'] ?? null,
            $data['color'] ?? '#4caf50',
        ]);

        $id = (int) $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM plant_species WHERE id = ?');
        $stmt->execute([$id]);

        http_response_code(201);
        echo json_encode(['species' => $stmt->fetch()]);
    }

    public function update(array $params): void
    {
        $userId = Auth::requireUserId();
        $species = $this->findOwnedSpecies((int) $params['id'], $userId);

        if (!$species) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono gatunku lub nie masz do niego uprawnień']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $name = trim((string) ($data['name'] ?? $species['name']));

        $db = Db::connection();
        $stmt = $db->prepare(
            'UPDATE plant_species SET
                name = ?, latin_name = ?, family = ?, spacing_cm = ?, row_spacing_cm = ?, depth_cm = ?,
                sun_requirement = ?, sow_start_month = ?, sow_end_month = ?, harvest_start_month = ?,
                harvest_end_month = ?, color = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $name,
            $data['latin_name'] ?? $species['latin_name'],
            $data['family'] ?? $species['family'],
            $data['spacing_cm'] ?? $species['spacing_cm'],
            $data['row_spacing_cm'] ?? $species['row_spacing_cm'],
            $data['depth_cm'] ?? $species['depth_cm'],
            $data['sun_requirement'] ?? $species['sun_requirement'],
            $data['sow_start_month'] ?? $species['sow_start_month'],
            $data['sow_end_month'] ?? $species['sow_end_month'],
            $data['harvest_start_month'] ?? $species['harvest_start_month'],
            $data['harvest_end_month'] ?? $species['harvest_end_month'],
            $data['color'] ?? $species['color'],
            $species['id'],
        ]);

        $stmt = $db->prepare('SELECT * FROM plant_species WHERE id = ?');
        $stmt->execute([$species['id']]);

        echo json_encode(['species' => $stmt->fetch()]);
    }

    // species_id w plantings jest NOT NULL bez ON DELETE CASCADE (w
    // odróżnieniu od variety_id, które ma ON DELETE SET NULL) - nasadzenie
    // bez gatunku nie ma sensu, więc usunięcie gatunku świadomie kasuje też
    // wszystkie nasadzenia, które go używały (frontend ostrzega o tym przed
    // wysłaniem żądania, korzystając z planting_count z index()).
    public function destroy(array $params): void
    {
        $userId = Auth::requireUserId();
        $species = $this->findOwnedSpecies((int) $params['id'], $userId);

        if (!$species) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono gatunku lub nie masz do niego uprawnień']);
            return;
        }

        $db = Db::connection();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare('DELETE FROM plantings WHERE species_id = ?');
            $stmt->execute([$species['id']]);
            $deletedPlantings = $stmt->rowCount();

            $stmt = $db->prepare('DELETE FROM plant_species WHERE id = ?');
            $stmt->execute([$species['id']]);

            $db->commit();
        } catch (Throwable) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Nie udało się usunąć gatunku']);
            return;
        }

        echo json_encode(['success' => true, 'deleted_plantings' => $deletedPlantings]);
    }

    // Gatunki systemowe (owner_id NULL) nigdy nie są "moje" - może je
    // edytować tylko właściciel, a systemowe są współdzielone tylko do odczytu.
    private function findOwnedSpecies(int $id, int $userId): ?array
    {
        $db = Db::connection();
        $stmt = $db->prepare('SELECT * FROM plant_species WHERE id = ? AND owner_id = ?');
        $stmt->execute([$id, $userId]);
        $species = $stmt->fetch();

        return $species ?: null;
    }
}
