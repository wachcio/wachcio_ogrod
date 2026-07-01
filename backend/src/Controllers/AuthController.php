<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth;

class AuthController
{
    public function register(array $params): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $name = trim((string) ($data['name'] ?? ''));

        if ($email === '' || $password === '' || $name === '') {
            http_response_code(422);
            echo json_encode(['error' => 'Wymagane pola: email, password, name']);
            return;
        }

        if (strlen($password) < 8) {
            http_response_code(422);
            echo json_encode(['error' => 'Hasło musi mieć co najmniej 8 znaków']);
            return;
        }

        try {
            $user = Auth::register($email, $password, $name);
            $_SESSION['user_id'] = $user['id'];
            http_response_code(201);
            echo json_encode(['user' => $user]);
        } catch (\RuntimeException $e) {
            http_response_code(409);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function login(array $params): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        try {
            $user = Auth::login($email, $password);
            echo json_encode(['user' => $user]);
        } catch (\RuntimeException $e) {
            http_response_code(401);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function logout(array $params): void
    {
        Auth::logout();
        echo json_encode(['success' => true]);
    }

    public function me(array $params): void
    {
        $user = Auth::currentUser();

        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Niezalogowano']);
            return;
        }

        echo json_encode(['user' => $user]);
    }
}
