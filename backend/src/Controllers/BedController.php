<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Db;

class BedController
{
    public function index(array $params): void
    {
        $userId = Auth::requireUserId();
        $gardenId = (int) $params['gardenId'];

        if (!$this->userOwnsGarden($gardenId, $userId)) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono ogrodu']);
            return;
        }

        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT id, garden_id, name, width_cm, length_cm, pos_x_cm, pos_y_cm, rotation_deg
             FROM beds WHERE garden_id = ? ORDER BY id'
        );
        $stmt->execute([$gardenId]);

        echo json_encode(['beds' => $stmt->fetchAll()]);
    }

    public function create(array $params): void
    {
        $userId = Auth::requireUserId();
        $gardenId = (int) $params['gardenId'];

        if (!$this->userOwnsGarden($gardenId, $userId)) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono ogrodu']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim((string) ($data['name'] ?? ''));
        $widthCm = (float) ($data['width_cm'] ?? 0);
        $lengthCm = (float) ($data['length_cm'] ?? 0);
        $posX = (float) ($data['pos_x_cm'] ?? 0);
        $posY = (float) ($data['pos_y_cm'] ?? 0);
        $rotation = (float) ($data['rotation_deg'] ?? 0);

        if ($name === '' || $widthCm <= 0 || $lengthCm <= 0) {
            http_response_code(422);
            echo json_encode(['error' => 'Nazwa oraz dodatnie wymiary (width_cm, length_cm) są wymagane']);
            return;
        }

        $db = Db::connection();
        $stmt = $db->prepare(
            'INSERT INTO beds (garden_id, name, width_cm, length_cm, pos_x_cm, pos_y_cm, rotation_deg)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([$gardenId, $name, $widthCm, $lengthCm, $posX, $posY, $rotation]);

        http_response_code(201);
        echo json_encode(['bed' => [
            'id' => (int) $db->lastInsertId(),
            'garden_id' => $gardenId,
            'name' => $name,
            'width_cm' => $widthCm,
            'length_cm' => $lengthCm,
            'pos_x_cm' => $posX,
            'pos_y_cm' => $posY,
            'rotation_deg' => $rotation,
        ]]);
    }

    public function update(array $params): void
    {
        $userId = Auth::requireUserId();
        $bed = $this->findOwnedBed((int) $params['id'], $userId);

        if (!$bed) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono grządki']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim((string) ($data['name'] ?? $bed['name']));
        $widthCm = isset($data['width_cm']) ? (float) $data['width_cm'] : (float) $bed['width_cm'];
        $lengthCm = isset($data['length_cm']) ? (float) $data['length_cm'] : (float) $bed['length_cm'];
        $posX = isset($data['pos_x_cm']) ? (float) $data['pos_x_cm'] : (float) $bed['pos_x_cm'];
        $posY = isset($data['pos_y_cm']) ? (float) $data['pos_y_cm'] : (float) $bed['pos_y_cm'];
        $rotation = isset($data['rotation_deg']) ? (float) $data['rotation_deg'] : (float) $bed['rotation_deg'];

        $db = Db::connection();
        $stmt = $db->prepare(
            'UPDATE beds SET name = ?, width_cm = ?, length_cm = ?, pos_x_cm = ?, pos_y_cm = ?, rotation_deg = ?
             WHERE id = ?'
        );
        $stmt->execute([$name, $widthCm, $lengthCm, $posX, $posY, $rotation, $bed['id']]);

        echo json_encode(['bed' => [
            'id' => (int) $bed['id'],
            'garden_id' => (int) $bed['garden_id'],
            'name' => $name,
            'width_cm' => $widthCm,
            'length_cm' => $lengthCm,
            'pos_x_cm' => $posX,
            'pos_y_cm' => $posY,
            'rotation_deg' => $rotation,
        ]]);
    }

    public function destroy(array $params): void
    {
        $userId = Auth::requireUserId();
        $bed = $this->findOwnedBed((int) $params['id'], $userId);

        if (!$bed) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono grządki']);
            return;
        }

        $db = Db::connection();
        $stmt = $db->prepare('DELETE FROM beds WHERE id = ?');
        $stmt->execute([$bed['id']]);

        echo json_encode(['success' => true]);
    }

    private function userOwnsGarden(int $gardenId, int $userId): bool
    {
        $db = Db::connection();
        $stmt = $db->prepare('SELECT id FROM gardens WHERE id = ? AND user_id = ?');
        $stmt->execute([$gardenId, $userId]);

        return (bool) $stmt->fetch();
    }

    // Grządka jest "moja" tylko jeśli ogród, do którego należy, należy do mnie -
    // stąd JOIN z gardens zamiast trzymania user_id bezpośrednio na beds.
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
}
