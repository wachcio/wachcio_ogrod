-- Startowa biblioteka gatunków (owner_id = NULL oznacza gatunek "systemowy",
-- widoczny dla wszystkich użytkowników i nieedytowalny przez nich).
INSERT INTO plant_species
    (name, latin_name, family, spacing_cm, row_spacing_cm, depth_cm, sun_requirement, sow_start_month, sow_end_month, harvest_start_month, harvest_end_month, color)
VALUES
    ('Marchew', 'Daucus carota', 'Baldaszkowate', 5, 25, 1.5, 'sun', 3, 6, 7, 10, '#ff9800'),
    ('Pomidor', 'Solanum lycopersicum', 'Psiankowate', 50, 60, 1.0, 'sun', 3, 5, 7, 10, '#e53935'),
    ('Ogórek', 'Cucumis sativus', 'Dyniowate', 30, 100, 2.0, 'sun', 5, 6, 7, 9, '#7cb342'),
    ('Cebula', 'Allium cepa', 'Amarylkowate', 10, 25, 2.0, 'sun', 3, 4, 7, 9, '#ffca28'),
    ('Sałata', 'Lactuca sativa', 'Astrowate', 25, 30, 0.5, 'partial_shade', 3, 8, 5, 10, '#8bc34a'),
    ('Papryka', 'Capsicum annuum', 'Psiankowate', 40, 50, 1.0, 'sun', 3, 4, 7, 10, '#fb8c00'),
    ('Ziemniak', 'Solanum tuberosum', 'Psiankowate', 30, 70, 10.0, 'sun', 4, 5, 7, 9, '#a1887f'),
    ('Fasola szparagowa', 'Phaseolus vulgaris', 'Bobowate', 10, 40, 3.0, 'sun', 5, 6, 7, 9, '#43a047'),
    ('Burak ćwikłowy', 'Beta vulgaris', 'Szarłatowate', 10, 30, 2.0, 'sun', 4, 6, 7, 10, '#8e24aa'),
    ('Rzodkiewka', 'Raphanus sativus', 'Kapustowate', 5, 15, 1.0, 'sun', 3, 9, 4, 10, '#d81b60'),
    ('Kapusta', 'Brassica oleracea', 'Kapustowate', 45, 50, 1.0, 'sun', 3, 5, 7, 11, '#66bb6a'),
    ('Groszek zielony', 'Pisum sativum', 'Bobowate', 5, 20, 3.0, 'sun', 3, 5, 6, 8, '#9ccc65');

INSERT INTO plant_varieties (species_id, name, days_to_harvest_min, days_to_harvest_max, description)
VALUES
    ((SELECT id FROM plant_species WHERE name = 'Marchew'), 'Nantejska', 70, 80, 'Cylindryczne korzenie, słodki smak, dobra do przechowywania'),
    ((SELECT id FROM plant_species WHERE name = 'Marchew'), 'Flakkee', 100, 120, 'Duże, długie korzenie, wysoki plon, dobrze się przechowuje'),
    ((SELECT id FROM plant_species WHERE name = 'Pomidor'), 'Malinowy Ożarowski', 70, 80, 'Polska odmiana gruntowa, mięsiste, malinowe owoce'),
    ((SELECT id FROM plant_species WHERE name = 'Pomidor'), 'Koktajlowy Cherry', 60, 70, 'Drobne, słodkie owoce, plenna odmiana'),
    ((SELECT id FROM plant_species WHERE name = 'Ogórek'), 'Krak F1', 45, 55, 'Odmiana gruntowa do konserw, krótkie owoce'),
    ((SELECT id FROM plant_species WHERE name = 'Ogórek'), 'Śremski', 50, 60, 'Tradycyjna polska odmiana konserwowa'),
    ((SELECT id FROM plant_species WHERE name = 'Cebula'), 'Wolska', 100, 110, 'Odmiana ostra, dobra do przechowywania'),
    ((SELECT id FROM plant_species WHERE name = 'Cebula'), 'Sztuttgarcka', 95, 105, 'Płaskookrągłe cebule, łagodniejszy smak'),
    ((SELECT id FROM plant_species WHERE name = 'Sałata'), 'Masłowa', 55, 65, 'Delikatne, maślane liście'),
    ((SELECT id FROM plant_species WHERE name = 'Sałata'), 'Lodowa', 65, 75, 'Chrupiąca, długo zachowuje świeżość'),
    ((SELECT id FROM plant_species WHERE name = 'Papryka'), 'Berington F1', 70, 80, 'Słodka papryka, czerwona po dojrzeniu'),
    ((SELECT id FROM plant_species WHERE name = 'Papryka'), 'Kalifornia Wonder', 75, 85, 'Klasyczna gruba papryka słodka'),
    ((SELECT id FROM plant_species WHERE name = 'Ziemniak'), 'Vineta', 70, 80, 'Wczesna odmiana, żółty miąższ'),
    ((SELECT id FROM plant_species WHERE name = 'Ziemniak'), 'Irga', 90, 100, 'Odmiana średnio wczesna, dobra do przechowywania'),
    ((SELECT id FROM plant_species WHERE name = 'Fasola szparagowa'), 'Złota Saxa', 60, 70, 'Żółte strączki, karłowa odmiana'),
    ((SELECT id FROM plant_species WHERE name = 'Fasola szparagowa'), 'Radew', 65, 75, 'Zielone strączki, wysoki plon'),
    ((SELECT id FROM plant_species WHERE name = 'Burak ćwikłowy'), 'Czerwona Kula', 80, 90, 'Okrągłe korzenie, intensywny kolor'),
    ((SELECT id FROM plant_species WHERE name = 'Burak ćwikłowy'), 'Nochowski', 90, 100, 'Polska odmiana, dobra do przetworów'),
    ((SELECT id FROM plant_species WHERE name = 'Rzodkiewka'), 'Saxa', 25, 30, 'Bardzo wczesna, okrągłe korzonki'),
    ((SELECT id FROM plant_species WHERE name = 'Rzodkiewka'), 'Sora', 28, 35, 'Odmiana odporna na przekwitanie'),
    ((SELECT id FROM plant_species WHERE name = 'Kapusta'), 'Kamienna Głowa', 100, 120, 'Odmiana późna, dobra do kiszenia'),
    ((SELECT id FROM plant_species WHERE name = 'Kapusta'), 'Rakoro F1', 65, 75, 'Odmiana wczesna, drobniejsze główki'),
    ((SELECT id FROM plant_species WHERE name = 'Groszek zielony'), 'Ambrozja', 60, 70, 'Odmiana wczesna, słodkie ziarna'),
    ((SELECT id FROM plant_species WHERE name = 'Groszek zielony'), 'Cud Kelvedonu', 60, 65, 'Klasyczna angielska odmiana');
