<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;
use App\Db;

class GardenController
{
    public function index(array $params): void
    {
        $userId = Auth::requireUserId();
        $db = Db::connection();

        $stmt = $db->prepare(
            'SELECT id, name, description, created_at FROM gardens WHERE user_id = ? ORDER BY created_at DESC'
        );
        $stmt->execute([$userId]);

        echo json_encode(['gardens' => $stmt->fetchAll()]);
    }

    public function create(array $params): void
    {
        $userId = Auth::requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $name = trim((string) ($data['name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));

        if ($name === '') {
            http_response_code(422);
            echo json_encode(['error' => 'Nazwa ogrodu jest wymagana']);
            return;
        }

        $db = Db::connection();
        $stmt = $db->prepare('INSERT INTO gardens (user_id, name, description) VALUES (?, ?, ?)');
        $stmt->execute([$userId, $name, $description]);

        http_response_code(201);
        echo json_encode(['garden' => [
            'id' => (int) $db->lastInsertId(),
            'name' => $name,
            'description' => $description,
        ]]);
    }

    public function show(array $params): void
    {
        $userId = Auth::requireUserId();
        $garden = $this->findOwnedGarden((int) $params['id'], $userId);

        if (!$garden) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono ogrodu']);
            return;
        }

        echo json_encode(['garden' => $garden]);
    }

    public function update(array $params): void
    {
        $userId = Auth::requireUserId();
        $garden = $this->findOwnedGarden((int) $params['id'], $userId);

        if (!$garden) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono ogrodu']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $name = trim((string) ($data['name'] ?? $garden['name']));
        $description = trim((string) ($data['description'] ?? $garden['description']));

        $db = Db::connection();
        $stmt = $db->prepare('UPDATE gardens SET name = ?, description = ? WHERE id = ?');
        $stmt->execute([$name, $description, $garden['id']]);

        echo json_encode(['garden' => [
            'id' => (int) $garden['id'],
            'name' => $name,
            'description' => $description,
        ]]);
    }

    public function destroy(array $params): void
    {
        $userId = Auth::requireUserId();
        $garden = $this->findOwnedGarden((int) $params['id'], $userId);

        if (!$garden) {
            http_response_code(404);
            echo json_encode(['error' => 'Nie znaleziono ogrodu']);
            return;
        }

        $db = Db::connection();
        $stmt = $db->prepare('DELETE FROM gardens WHERE id = ?');
        $stmt->execute([$garden['id']]);

        echo json_encode(['success' => true]);
    }

    // Ładuje ogród tylko jeśli należy do zalogowanego użytkownika - to nasza
    // jedyna linia obrony przed podejrzeniem cudzego ogrodu przez zgadnięcie id.
    private function findOwnedGarden(int $id, int $userId): ?array
    {
        $db = Db::connection();
        $stmt = $db->prepare(
            'SELECT id, name, description, created_at FROM gardens WHERE id = ? AND user_id = ?'
        );
        $stmt->execute([$id, $userId]);
        $garden = $stmt->fetch();

        return $garden ?: null;
    }
}
