<?php

declare(strict_types=1);

require __DIR__ . '/../src/autoload.php';

use App\Controllers\AuthController;
use App\Controllers\BedController;
use App\Controllers\GardenController;
use App\Controllers\PlantingController;
use App\Controllers\SpeciesController;
use App\Controllers\VarietyController;
use App\Router;

// Frontend (Vite dev server) i backend siedzą na różnych portach, więc każdy
// request to zapytanie cross-origin. Access-Control-Allow-Credentials + stały
// (nie "*") Allow-Origin są wymagane, żeby przeglądarka wysyłała/przyjmowała
// cookie sesji PHP.
$allowedOrigin = getenv('FRONTEND_ORIGIN') ?: 'http://localhost:5173';
header("Access-Control-Allow-Origin: {$allowedOrigin}");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Przeglądarka przed właściwym żądaniem (PUT/DELETE/JSON) wysyła preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'samesite' => 'Lax',
]);
session_start();

$router = new Router();

$router->get('/health', function (): void {
    echo json_encode(['status' => 'ok']);
});

$auth = new AuthController();
$router->post('/auth/register', [$auth, 'register']);
$router->post('/auth/login', [$auth, 'login']);
$router->post('/auth/logout', [$auth, 'logout']);
$router->get('/auth/me', [$auth, 'me']);

$gardens = new GardenController();
$router->get('/gardens', [$gardens, 'index']);
$router->post('/gardens', [$gardens, 'create']);
$router->get('/gardens/{id}', [$gardens, 'show']);
$router->put('/gardens/{id}', [$gardens, 'update']);
$router->delete('/gardens/{id}', [$gardens, 'destroy']);

$beds = new BedController();
$router->get('/gardens/{gardenId}/beds', [$beds, 'index']);
$router->post('/gardens/{gardenId}/beds', [$beds, 'create']);
$router->get('/beds/{id}', [$beds, 'show']);
$router->put('/beds/{id}', [$beds, 'update']);
$router->delete('/beds/{id}', [$beds, 'destroy']);

$species = new SpeciesController();
$router->get('/species', [$species, 'index']);
$router->post('/species', [$species, 'create']);
$router->put('/species/{id}', [$species, 'update']);
$router->delete('/species/{id}', [$species, 'destroy']);

$varieties = new VarietyController();
$router->get('/species/{speciesId}/varieties', [$varieties, 'index']);
$router->post('/species/{speciesId}/varieties', [$varieties, 'create']);
$router->delete('/varieties/{id}', [$varieties, 'destroy']);

$plantings = new PlantingController();
$router->get('/beds/{bedId}/plantings', [$plantings, 'index']);
$router->post('/beds/{bedId}/plantings', [$plantings, 'create']);
$router->delete('/plantings/{id}', [$plantings, 'destroy']);

// Wszystkie trasy backendu są pod /api - ścinamy ten prefiks przed dopasowaniem
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$path = preg_replace('#^/api#', '', $path);
$path = $path === '' ? '/' : $path;

$router->dispatch($_SERVER['REQUEST_METHOD'], $path);
