<?php

declare(strict_types=1);

namespace App;

// Logowanie sesyjne (PHP session + cookie), a nie JWT - prostsze do nauki
// i wystarczające dla lokalnej aplikacji. Id zalogowanego użytkownika
// trzymamy w $_SESSION['user_id'].
class Auth
{
    public static function register(string $email, string $password, string $name): array
    {
        $db = Db::connection();

        $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            throw new \RuntimeException('Użytkownik z tym adresem e-mail już istnieje');
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $db->prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
        $stmt->execute([$email, $hash, $name]);

        return [
            'id' => (int) $db->lastInsertId(),
            'email' => $email,
            'name' => $name,
        ];
    }

    public static function login(string $email, string $password): array
    {
        $db = Db::connection();

        $stmt = $db->prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new \RuntimeException('Nieprawidłowy e-mail lub hasło');
        }

        $_SESSION['user_id'] = (int) $user['id'];

        return [
            'id' => (int) $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
        ];
    }

    public static function logout(): void
    {
        $_SESSION = [];
        session_destroy();
    }

    public static function currentUser(): ?array
    {
        if (empty($_SESSION['user_id'])) {
            return null;
        }

        $db = Db::connection();
        $stmt = $db->prepare('SELECT id, email, name FROM users WHERE id = ?');
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    // Do wywołania na początku każdej chronionej akcji kontrolera - kończy
    // request odpowiedzią 401, jeśli nikt nie jest zalogowany.
    public static function requireUserId(): int
    {
        if (empty($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Wymagane logowanie']);
            exit;
        }

        return (int) $_SESSION['user_id'];
    }
}
