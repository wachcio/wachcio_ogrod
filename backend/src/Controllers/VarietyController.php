<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Db;

class VarietyController
{
    public function index(array $params): void
    {
        $userId = Auth::requireUserId();
        $speciesId = (int) $params['speciesId'];

        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT * FROM plant_varieties WHERE species_id = ? AND (owner_id IS NULL OR owner_id = ?) ORDER BY name'
        );
        $stmt->execute([$speciesId, $userId]);

        echo json_encode(['varieties' => $stmt->fetchAll()]);
    }

    public function create(array $params): void
    {
        $userId = Auth::requireUserId();
        $speciesId = (int) $params['speciesId'];
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            http_response_code(422);
            echo json_encode(['error' => 'Nazwa odmiany jest wymagana']);
            return;
        }

        $db = Db::connection();

        $stmt = $db->prepare('SELECT id FROM plant_species WHERE id = ? AND (owner_id IS NULL OR owner_id = ?)');
        $stmt->execute([$speciesId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono gatunku']);
            return;
        }

        $stmt = $db->prepare(
            'INSERT INTO plant_varieties (species_id, owner_id, name, days_to_harvest_min, days_to_harvest_max, seed_source, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $speciesId,
            $userId,
            $name,
            $data['days_to_harvest_min'] ?? null,
            $data['days_to_harvest_max'] ?? null,
            $data['seed_source'] ?? null,
            $data['description'] ?? null,
        ]);

        $id = (int) $db->lastInsertId();
        $stmt = $db->prepare('SELECT * FROM plant_varieties WHERE id = ?');
        $stmt->execute([$id]);

        http_response_code(201);
        echo json_encode(['variety' => $stmt->fetch()]);
    }

    public function destroy(array $params): void
    {
        $userId = Auth::requireUserId();
        $variety = $this->findOwnedVariety((int) $params['id'], $userId);

        if (!$variety) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono odmiany lub nie masz do niej uprawnień']);
            return;
        }

        $db = Db::connection();
        $stmt = $db->prepare('DELETE FROM plant_varieties WHERE id = ?');
        $stmt->execute([$variety['id']]);

        echo json_encode(['success' => true]);
    }

    private function findOwnedVariety(int $id, int $userId): ?array
    {
        $db = Db::connection();
        $stmt = $db->prepare('SELECT * FROM plant_varieties WHERE id = ? AND owner_id = ?');
        $stmt->execute([$id, $userId]);
        $variety = $stmt->fetch();

        return $variety ?: null;
    }
}
