-- Wspiera zapytania o rotację upraw (PlantingController::checkRotationWarning),
-- które filtrują nasadzenia na danej grządce po dacie posadzenia.
ALTER TABLE plantings ADD INDEX idx_bed_planted_date (bed_id, planted_date);
