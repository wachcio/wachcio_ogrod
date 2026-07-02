<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Db;

class PlantingController
{
    private const ROTATION_WINDOW_MONTHS = 24;

    public function index(array $params): void
    {
        $userId = Auth::requireUserId();
        $bedId = (int) $params['bedId'];

        if (!$this->userOwnsBed($bedId, $userId)) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono grządki']);
            return;
        }

        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT p.*, s.name AS species_name, s.color AS species_color, s.family AS species_family, v.name AS variety_name
             FROM plantings p
             JOIN plant_species s ON s.id = p.species_id
             LEFT JOIN plant_varieties v ON v.id = p.variety_id
             WHERE p.bed_id = ?
             ORDER BY p.id'
        );
        $stmt->execute([$bedId]);

        echo json_encode(['plantings' => $stmt->fetchAll()]);
    }

    public function create(array $params): void
    {
        $userId = Auth::requireUserId();
        $bedId = (int) $params['bedId'];

        $bed = $this->findOwnedBed($bedId, $userId);
        if (!$bed) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono grządki']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        [$values, $error] = $this->validate($data, $bed, $userId);

        if ($error !== null) {
            http_response_code(422);
            echo json_encode(['error' => $error]);
            return;
        }

        $warning = $this->checkRotationWarning($bedId, $values['species_id']);

        $db = Db::connection();
        $stmt = $db->prepare(
            'INSERT INTO plantings (bed_id, species_id, variety_id, type, x_cm, y_cm, x2_cm, y2_cm, spacing_cm, planted_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $bedId,
            $values['species_id'],
            $values['variety_id'],
            $values['type'],
            $values['x_cm'],
            $values['y_cm'],
            $values['x2_cm'],
            $values['y2_cm'],
            $values['spacing_cm'],
            $values['planted_date'],
            $values['notes'],
        ]);

        http_response_code(201);
        echo json_encode([
            'planting' => $this->findPlanting((int) $db->lastInsertId()),
            'warning' => $warning,
        ]);
    }

    // Ostrzeżenie o płodozmianie: sprawdza, czy na tej samej grządce
    // niedawno (ROTATION_WINDOW_MONTHS wstecz) rosła już roślina z tej
    // samej rodziny botanicznej. To tylko podpowiedź, nigdy nie blokuje
    // zapisu - sadzenie tego samego gatunku dwa razy pod rząd bywa
    // celowe (np. testowanie odmian), więc decyzję zostawiamy użytkownikowi.
    private function checkRotationWarning(int $bedId, int $newSpeciesId): ?string
    {
        $db = Db::connection();

        $stmt = $db->prepare('SELECT family FROM plant_species WHERE id = ?');
        $stmt->execute([$newSpeciesId]);
        $family = $stmt->fetchColumn();

        if (!$family) {
            return null;
        }

        $cutoff = (new \DateTimeImmutable())->modify('-' . self::ROTATION_WINDOW_MONTHS . ' months')->format('Y-m-d');

        $stmt = $db->prepare(
            'SELECT p.planted_date, s.name AS species_name
             FROM plantings p
             JOIN plant_species s ON s.id = p.species_id
             WHERE p.bed_id = ? AND s.family = ? AND (p.planted_date IS NULL OR p.planted_date >= ?)
             ORDER BY p.planted_date IS NULL ASC, p.planted_date DESC
             LIMIT 1'
        );
        $stmt->execute([$bedId, $family, $cutoff]);
        $previous = $stmt->fetch();

        if (!$previous) {
            return null;
        }

        $when = $previous['planted_date'] ? " ({$previous['planted_date']})" : '';

        return "Na tej grządce rosła już roślina z rodziny \"{$family}\" ({$previous['species_name']}{$when}) - rozważ płodozmian.";
    }

    // Edycja zmienia tylko gatunek/odmianę/odstęp/datę/notatkę - nie
    // geometrię (x/y/x2/y2). Przesunięcie nasadzenia wymagałoby
    // przeciągania na canvasie, którego jeszcze nie ma - żeby to zrobić,
    // trzeba dziś usunąć nasadzenie i dodać je ponownie w nowym miejscu.
    public function update(array $params): void
    {
        $userId = Auth::requireUserId();
        $planting = $this->findOwnedPlanting((int) $params['id'], $userId);

        if (!$planting) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono nasadzenia']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $speciesId = isset($data['species_id']) ? (int) $data['species_id'] : (int) $planting['species_id'];
        if (!$this->isSpeciesVisible($speciesId, $userId)) {
            http_response_code(422);
            echo json_encode(['error' => 'Nie znaleziono wybranego gatunku']);
            return;
        }

        if (array_key_exists('variety_id', $data)) {
            $varietyId = $data['variety_id'] !== null && $data['variety_id'] !== '' ? (int) $data['variety_id'] : null;
        } else {
            $varietyId = $planting['variety_id'] !== null ? (int) $planting['variety_id'] : null;
        }
        if ($varietyId !== null && !$this->isVarietyVisible($varietyId, $speciesId, $userId)) {
            http_response_code(422);
            echo json_encode(['error' => 'Nie znaleziono wybranej odmiany dla tego gatunku']);
            return;
        }

        $spacing = $planting['spacing_cm'];
        if ($planting['type'] === 'row') {
            $spacing = array_key_exists('spacing_cm', $data) ? (float) $data['spacing_cm'] : (float) $planting['spacing_cm'];
            if ($spacing <= 0) {
                http_response_code(422);
                echo json_encode(['error' => 'Dla rzędu wymagany jest dodatni odstęp spacing_cm']);
                return;
            }
        }

        $plantedDate = array_key_exists('planted_date', $data) ? $data['planted_date'] : $planting['planted_date'];
        $notes = array_key_exists('notes', $data) ? $data['notes'] : $planting['notes'];

        $db = Db::connection();
        $stmt = $db->prepare(
            'UPDATE plantings SET species_id = ?, variety_id = ?, spacing_cm = ?, planted_date = ?, notes = ? WHERE id = ?'
        );
        $stmt->execute([$speciesId, $varietyId, $spacing, $plantedDate, $notes, $planting['id']]);

        echo json_encode(['planting' => $this->findPlanting((int) $planting['id'])]);
    }

    public function destroy(array $params): void
    {
        $userId = Auth::requireUserId();
        $planting = $this->findOwnedPlanting((int) $params['id'], $userId);

        if (!$planting) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono nasadzenia']);
            return;
        }

        $db = Db::connection();
        $stmt = $db->prepare('DELETE FROM plantings WHERE id = ?');
        $stmt->execute([$planting['id']]);

        echo json_encode(['success' => true]);
    }

    /** @return array{0: array<string, mixed>, 1: string|null} */
    private function validate(array $data, array $bed, int $userId): array
    {
        $type = $data['type'] ?? null;
        if (!in_array($type, ['point', 'row'], true)) {
            return [[], 'Pole type musi mieć wartość "point" lub "row"'];
        }

        $speciesId = (int) ($data['species_id'] ?? 0);
        if (!$this->isSpeciesVisible($speciesId, $userId)) {
            return [[], 'Nie znaleziono wybranego gatunku'];
        }

        $varietyId = isset($data['variety_id']) && $data['variety_id'] !== null && $data['variety_id'] !== ''
            ? (int) $data['variety_id']
            : null;
        if ($varietyId !== null && !$this->isVarietyVisible($varietyId, $speciesId, $userId)) {
            return [[], 'Nie znaleziono wybranej odmiany dla tego gatunku'];
        }

        $widthCm = (float) $bed['width_cm'];
        $lengthCm = (float) $bed['length_cm'];

        $x = (float) ($data['x_cm'] ?? -1);
        $y = (float) ($data['y_cm'] ?? -1);
        if (!$this->isWithinBed($x, $y, $widthCm, $lengthCm)) {
            return [[], 'Współrzędne x_cm/y_cm muszą mieścić się w obrębie grządki'];
        }

        $x2 = null;
        $y2 = null;
        $spacing = null;

        if ($type === 'row') {
            $x2 = (float) ($data['x2_cm'] ?? -1);
            $y2 = (float) ($data['y2_cm'] ?? -1);
            if (!$this->isWithinBed($x2, $y2, $widthCm, $lengthCm)) {
                return [[], 'Współrzędne x2_cm/y2_cm muszą mieścić się w obrębie grządki'];
            }

            $spacing = (float) ($data['spacing_cm'] ?? 0);
            if ($spacing <= 0) {
                return [[], 'Dla rzędu wymagany jest dodatni odstęp spacing_cm'];
            }
        }

        return [[
            'species_id' => $speciesId,
            'variety_id' => $varietyId,
            'type' => $type,
            'x_cm' => $x,
            'y_cm' => $y,
            'x2_cm' => $x2,
            'y2_cm' => $y2,
            'spacing_cm' => $spacing,
            'planted_date' => $data['planted_date'] ?? null,
            'notes' => $data['notes'] ?? null,
        ], null];
    }

    private function isWithinBed(float $x, float $y, float $width, float $length): bool
    {
        return $x >= 0 && $x <= $width && $y >= 0 && $y <= $length;
    }

    private function isSpeciesVisible(int $speciesId, int $userId): bool
    {
        $db = Db::connection();
        $stmt = $db->prepare('SELECT id FROM plant_species WHERE id = ? AND (owner_id IS NULL OR owner_id = ?)');
        $stmt->execute([$speciesId, $userId]);

        return (bool) $stmt->fetch();
    }

    private function isVarietyVisible(int $varietyId, int $speciesId, int $userId): bool
    {
        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT id FROM plant_varieties WHERE id = ? AND species_id = ? AND (owner_id IS NULL OR owner_id = ?)'
        );
        $stmt->execute([$varietyId, $speciesId, $userId]);

        return (bool) $stmt->fetch();
    }

    private function userOwnsBed(int $bedId, int $userId): bool
    {
        return $this->findOwnedBed($bedId, $userId) !== null;
    }

    private function findOwnedBed(int $bedId, int $userId): ?array
    {
        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT b.* FROM beds b JOIN gardens g ON g.id = b.garden_id WHERE b.id = ? AND g.user_id = ?'
        );
        $stmt->execute([$bedId, $userId]);
        $bed = $stmt->fetch();

        return $bed ?: null;
    }

    private function findOwnedPlanting(int $plantingId, int $userId): ?array
    {
        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT p.* FROM plantings p
             JOIN beds b ON b.id = p.bed_id
             JOIN gardens g ON g.id = b.garden_id
             WHERE p.id = ? AND g.user_id = ?'
        );
        $stmt->execute([$plantingId, $userId]);
        $planting = $stmt->fetch();

        return $planting ?: null;
    }

    private function findPlanting(int $id): ?array
    {
        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT p.*, s.name AS species_name, s.color AS species_color, s.family AS species_family, v.name AS variety_name
             FROM plantings p
             JOIN plant_species s ON s.id = p.species_id
             LEFT JOIN plant_varieties v ON v.id = p.variety_id
             WHERE p.id = ?'
        );
        $stmt->execute([$id]);
        $planting = $stmt->fetch();

        return $planting ?: null;
    }
}
