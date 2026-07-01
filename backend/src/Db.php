<?php

declare(strict_types=1);

namespace App;

use PDO;

// Jedno wspólne połączenie PDO na cały request (singleton) - unikamy
// otwierania nowego połączenia z bazą przy każdym wywołaniu Db::connection().
class Db
{
    private static ?PDO $instance = null;

    public static function connection(): PDO
    {
        if (self::$instance === null) {
            $host = getenv('DB_HOST') ?: 'db';
            $name = getenv('DB_NAME') ?: '';
            $user = getenv('DB_USER') ?: '';
            $pass = getenv('DB_PASSWORD') ?: '';

            $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";

            self::$instance = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Bez tego PDO "emuluje" przygotowane zapytania i zwraca
                // każdą kolumnę jako string (np. id "3" zamiast liczby 3),
                // co po json_encode() dawałoby "3" w JSON zamiast 3.
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        }

        return self::$instance;
    }
}
