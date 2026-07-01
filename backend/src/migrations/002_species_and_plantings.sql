CREATE TABLE IF NOT EXISTS plant_species (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id INT UNSIGNED NULL,
    name VARCHAR(120) NOT NULL,
    latin_name VARCHAR(150) NULL,
    family VARCHAR(80) NULL,
    spacing_cm DECIMAL(6,1) NULL,
    row_spacing_cm DECIMAL(6,1) NULL,
    depth_cm DECIMAL(5,1) NULL,
    sun_requirement ENUM('sun','partial_shade','shade') NULL,
    sow_start_month TINYINT UNSIGNED NULL,
    sow_end_month TINYINT UNSIGNED NULL,
    harvest_start_month TINYINT UNSIGNED NULL,
    harvest_end_month TINYINT UNSIGNED NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#4caf50',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plant_varieties (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    species_id INT UNSIGNED NOT NULL,
    owner_id INT UNSIGNED NULL,
    name VARCHAR(120) NOT NULL,
    days_to_harvest_min SMALLINT UNSIGNED NULL,
    days_to_harvest_max SMALLINT UNSIGNED NULL,
    seed_source VARCHAR(150) NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (species_id) REFERENCES plant_species(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sadzenie: 'point' to pojedynczy punkt (x_cm, y_cm), 'row' to rząd
-- opisany odcinkiem od (x_cm, y_cm) do (x2_cm, y2_cm) z odstępem spacing_cm
-- między roślinami - frontend sam rozmieszcza punkty wzdłuż odcinka.
CREATE TABLE IF NOT EXISTS plantings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bed_id INT UNSIGNED NOT NULL,
    species_id INT UNSIGNED NOT NULL,
    variety_id INT UNSIGNED NULL,
    type ENUM('point','row') NOT NULL,
    x_cm DECIMAL(7,1) NOT NULL,
    y_cm DECIMAL(7,1) NOT NULL,
    x2_cm DECIMAL(7,1) NULL,
    y2_cm DECIMAL(7,1) NULL,
    spacing_cm DECIMAL(6,1) NULL,
    planted_date DATE NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE CASCADE,
    FOREIGN KEY (species_id) REFERENCES plant_species(id),
    FOREIGN KEY (variety_id) REFERENCES plant_varieties(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
