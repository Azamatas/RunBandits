-- PostgreSQL data population script for RunBanditsRun
-- INSERTs ONLY - no DDL
-- Run this AFTER init_db.sql to populate with seed data
-- Polylines generated via ST_AsEncodedPolyline(ST_GeomFromText(LINESTRING, 4326))

-- ============================================
-- DATA INSERTION
-- ============================================

-- Users
INSERT INTO users (id, username, email, password_hash, bio, location, created_at) VALUES
    (1, 'alice_runner', 'alice@example.com', '$2b$12$dummyhashalice', 'Marathon enthusiast and coffee addict. Training for Boston 2026!', 'Boston, MA', CURRENT_TIMESTAMP - INTERVAL '30 days'),
    (2, 'bob_cyclist', 'bob@example.com', '$2b$12$dummyhashbob', 'Road cyclist. Love climbing hills and long century rides.', 'San Francisco, CA', CURRENT_TIMESTAMP - INTERVAL '25 days'),
    (4, 'diana_hiker', 'diana@example.com', '$2b$12$dummyhashdiana', 'Trail runner and mountain hiker. Love the great outdoors!', 'Denver, CO', CURRENT_TIMESTAMP - INTERVAL '15 days'),
    (5, 'eve_walker', 'eve@example.com', '$2b$12$dummyhasheve', 'Casual walker, love city walks and nature trails.', 'New York, NY', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    (6, 'frank_runner', 'frank@example.com', '$2b$12$dummyhashfrank', '5K and 10K specialist. Always chasing a new PR!', 'Chicago, IL', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    (7, 'grace_triathlete', 'grace@example.com', '$2b$12$dummyhashgrace', 'Ironman finisher. Bike, run, repeat.', 'Austin, TX', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (8, 'henry_cyclist', 'henry@example.com', '$2b$12$dummyhashhenry', 'Gravel rider and bike packer.', 'Portland, OR', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (9, 'ian_runner', 'ian@example.com', '$2b$12$dummyhashian', 'Ultra runner. Prefer trails to pavement.', 'Seattle, WA', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (10, 'julia_trail', 'julia@example.com', '$2b$12$dummyhashjulia', 'Trail runner and weekend warrior.', 'Los Angeles, CA', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (11, 'kevin_sprinter', 'kevin@example.com', '$2b$12$dummyhashkevin', 'Speed is my game. 400m to marathon.', 'Miami, FL', CURRENT_TIMESTAMP - INTERVAL '12 hours');

-- Common Activities (frequently-matched shared routes)
INSERT INTO common_activities (id, name, polyline, distance, sport_type) VALUES
    (1, 'Charles River Long Run',  '_toaGnw{pLwQg^_Xg^_Xwj@wQg^wQwQwQvQnKf^nKf^~Wf^~W~W~WvQ~W?', 16500, 'run'),
    (2, 'Mount Tam Classic Loop', '_jifFnszjVo}@v|Ao}@n}@g^v|An}@n}@n}@n}@n}@g^f^o}@nKw|AoKw|Ag^o}@g^g^', 56000, 'ride'),
    (3, '5K Park Loop',           'gy|wFfhmbMvQwQvQ_XnKwQnKoKnKnKoKvQwQvQwQvQ_XfE', 5000, 'run'),
    (4, 'Century Ride Route',     'w|peFnecjVv|Aw|A~{Bw|A~{Bw|A~{Bo}@~{Bg^~{Bf^n}@v|Af^v|Ag^v|Ao}@v|A_|Bn}@_|B?_|Bg^_|Bg^_|Bg^w|A?', 100000, 'ride');

-- Activities (distance in meters, duration in seconds)
INSERT INTO activities (id, owner_id, title, sport_type, distance, duration, polyline, visibility, started_at, created_at, common_activity_id) VALUES
    -- Alice's activities (runner)
    (1, 1, 'Morning Long Run', 'run', 16500, 6240, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '2 days 2 hours', CURRENT_TIMESTAMP - INTERVAL '2 days', 1),
    (2, 1, 'Tempo Run on Esplanade', 'run', 8200, 2400, 'o`paGvyxpL_XwQwQ_XoK_XgE_XvQwQvQvQnK~WnK~WnK~WoKvQ', 'public', CURRENT_TIMESTAMP - INTERVAL '5 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '5 days', NULL),
    (3, 1, 'Recovery Run', 'run', 5000, 2520, (SELECT polyline FROM common_activities WHERE id=3), 'friends', CURRENT_TIMESTAMP - INTERVAL '8 days 7 hours', CURRENT_TIMESTAMP - INTERVAL '8 days', 3),
    -- Bob's activities (cyclist)
    (4, 2, 'Mount Tam ride', 'ride', 56000, 15600, (SELECT polyline FROM common_activities WHERE id=2), 'public', CURRENT_TIMESTAMP - INTERVAL '1 day 3 hours', CURRENT_TIMESTAMP - INTERVAL '1 day', 2),
    (5, 2, 'Golden Gate Bridge loops', 'ride', 42300, 9800, 'gxveFv{ojVg^g^g^o}@g^o}@g^g^g^g^g^g^wQg^oKo}@nKg^vQg^f^f^f^n}@f^n}@f^n}@f^n}@f^n}@?n}@', 'public', CURRENT_TIMESTAMP - INTERVAL '4 days 4 hours', CURRENT_TIMESTAMP - INTERVAL '4 days', NULL),
    (6, 2, 'Commute to work', 'ride', 12500, 2400, 'o}oeF~cejVg^g^g^g^g^g^g^g^o}@g^', 'private', CURRENT_TIMESTAMP - INTERVAL '7 days 8 hours', CURRENT_TIMESTAMP - INTERVAL '7 days', NULL),
    -- Diana's activities (hiker)
    (9, 4, 'Longs Peak Ascent', 'hike', 14500, 28800, 'whutFv|rcSvQwQnK_XnKwQoKg^g^wQg^oKoKg^nKoKvQnK', 'public', CURRENT_TIMESTAMP - INTERVAL '10 days 5 hours', CURRENT_TIMESTAMP - INTERVAL '10 days', NULL),
    (10, 4, 'Rocky Mountain National Park Trail', 'hike', 8700, 14400, 'ozguFnkidSnKg^vQg^vQg^nKg^oKg^wQg^wQf^oKf^', 'public', CURRENT_TIMESTAMP - INTERVAL '12 days 7 hours', CURRENT_TIMESTAMP - INTERVAL '12 days', NULL),
    -- Eve's activities (walker)
    (11, 5, 'Central Park Walk', 'walk', 5000, 6000, 'of|wF~snbMnKoKnKwQnKoKnK?gEvQwQnK_XnK', 'public', CURRENT_TIMESTAMP - INTERVAL '1 day 10 hours', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL),
    (12, 5, 'Hudson River Greenway', 'walk', 3800, 4200, 'g_uwFnavbMvQvQnKnKvQnKvQfEfEwQoKwQwQoKwQoK_XnK', 'public', CURRENT_TIMESTAMP - INTERVAL '3 days 14 hours', CURRENT_TIMESTAMP - INTERVAL '3 days', NULL),
    -- Frank's activities (runner)
    (13, 6, '5K Race', 'run', 5000, 1260, (SELECT polyline FROM common_activities WHERE id=3), 'public', CURRENT_TIMESTAMP - INTERVAL '2 days 18 hours', CURRENT_TIMESTAMP - INTERVAL '2 days', 3),
    (14, 6, 'Lakefront 10K', 'run', 10000, 2700, 'gts~F~gxuOg^oKg^wQg^wQg^oKg^oKg^nKg^nKg^vQg^vQ', 'public', CURRENT_TIMESTAMP - INTERVAL '5 days 9 hours', CURRENT_TIMESTAMP - INTERVAL '5 days', NULL),
    -- Grace's activities (triathlete)
    (15, 7, 'Ironman Training - Long Bike', 'ride', 112000, 28800, (SELECT polyline FROM common_activities WHERE id=4), 'public', CURRENT_TIMESTAMP - INTERVAL '15 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '15 days', 4),
    (17, 7, 'Brick Workout - Bike to Run', 'run', 10000, 3000, 'gcvwDfyqsQwQg^oKg^oKg^nKg^nKg^vQoKvQnKnKf^nKf^', 'public', CURRENT_TIMESTAMP - INTERVAL '17 days 8 hours', CURRENT_TIMESTAMP - INTERVAL '17 days', NULL),
    -- Henry's activities (cyclist)
    (18, 8, 'Gravel Century', 'ride', 100000, 36000, (SELECT polyline FROM common_activities WHERE id=4), 'public', CURRENT_TIMESTAMP - INTERVAL '20 days 4 hours', CURRENT_TIMESTAMP - INTERVAL '20 days', 4),
    (19, 8, 'Forest Park Loops', 'ride', 25500, 6600, '_sytG~v_lVg^g^g^g^g^g^g^g^g^g^g^g^g^f^wQf^vQf^f^f^f^f^f^f^f^f^f^f^f^f^f^w|A', 'public', CURRENT_TIMESTAMP - INTERVAL '22 days 5 hours', CURRENT_TIMESTAMP - INTERVAL '22 days', NULL),
    -- Competitive activities on common routes
    (20, 6, 'Charles River Long Run', 'run', 16500, 6300, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '6 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '6 days', 1),
    (21, 7, 'Charles River Tempo', 'run', 16500, 6180, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '9 days 5 hours', CURRENT_TIMESTAMP - INTERVAL '9 days', 1),
    (22, 8, 'Mount Tam Classic', 'ride', 56000, 16200, (SELECT polyline FROM common_activities WHERE id=2), 'public', CURRENT_TIMESTAMP - INTERVAL '3 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '3 days', 2),
    (23, 7, 'Mount Tam Ride', 'ride', 56000, 14400, (SELECT polyline FROM common_activities WHERE id=2), 'public', CURRENT_TIMESTAMP - INTERVAL '11 days 5 hours', CURRENT_TIMESTAMP - INTERVAL '11 days', 2),
    -- More Charles River competitors for a full 10-athlete leaderboard
    (24, 8, 'Charles River Run', 'run', 16500, 6480, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '4 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '4 days', 1),
    (25, 2, 'Charles River Cross-Training', 'run', 16500, 6600, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '7 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '7 days', 1),
    (26, 4, 'Charles River Easy Run', 'run', 16500, 6120, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '10 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '10 days', 1),
    (27, 5, 'Charles River Jog', 'run', 16500, 7200, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '13 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '13 days', 1),
    (28, 9, 'Charles River Long Run', 'run', 16500, 6420, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '1 day 6 hours', CURRENT_TIMESTAMP - INTERVAL '1 day', 1),
    (29, 10, 'Charles River Shakeout', 'run', 16500, 6960, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '3 days 6 hours', CURRENT_TIMESTAMP - INTERVAL '3 days', 1),
    (30, 11, 'Charles River Blast', 'run', 16500, 6360, (SELECT polyline FROM common_activities WHERE id=1), 'public', CURRENT_TIMESTAMP - INTERVAL '18 hours', CURRENT_TIMESTAMP - INTERVAL '12 hours', 1);

-- Activity-Athlete many-to-many (tagged users in activities)
INSERT INTO activity_athletes (activity_id, user_id) VALUES
    (1, 6),
    (4, 2),
    (4, 1),
    (9, 4),
    (9, 1),
    (15, 7),
    (15, 2),
    (20, 6),
    (20, 1),
    (21, 7),
    (22, 8),
    (22, 2),
    (23, 8),
    (23, 7);

-- Friendships (accepted relationships)
INSERT INTO friendships (id, requester_id, addressee_id, status, created_at) VALUES
    (1, 1, 2, 'accepted', CURRENT_TIMESTAMP - INTERVAL '25 days'),
    (2, 1, 4, 'accepted', CURRENT_TIMESTAMP - INTERVAL '18 days'),
    (3, 2, 1, 'accepted', CURRENT_TIMESTAMP - INTERVAL '24 days'),
    (4, 2, 4, 'accepted', CURRENT_TIMESTAMP - INTERVAL '15 days'),
    (8, 4, 1, 'accepted', CURRENT_TIMESTAMP - INTERVAL '17 days'),
    (9, 4, 5, 'accepted', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    (10, 5, 4, 'accepted', CURRENT_TIMESTAMP - INTERVAL '9 days'),
    (11, 6, 1, 'accepted', CURRENT_TIMESTAMP - INTERVAL '8 days'),
    (12, 1, 6, 'accepted', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    (13, 7, 2, 'accepted', CURRENT_TIMESTAMP - INTERVAL '6 days'),
    (14, 2, 7, 'accepted', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    (15, 8, 2, 'accepted', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (16, 2, 8, 'accepted', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Pending friendship requests
INSERT INTO friendships (id, requester_id, addressee_id, status, created_at) VALUES
    (17, 5, 1, 'pending', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (18, 6, 2, 'pending', CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (19, 7, 1, 'pending', CURRENT_TIMESTAMP - INTERVAL '12 hours');

-- Kudos (likes on activities)
INSERT INTO kudos (id, activity_id, user_id, created_at) VALUES
    (1, 15, 1, CURRENT_TIMESTAMP - INTERVAL '15 days 5 hours'),
    (2, 15, 2, CURRENT_TIMESTAMP - INTERVAL '15 days 4 hours'),
    (3, 15, 4, CURRENT_TIMESTAMP - INTERVAL '15 days 4 hours'),
    (4, 15, 5, CURRENT_TIMESTAMP - INTERVAL '15 days 3 hours'),
    (5, 15, 7, CURRENT_TIMESTAMP - INTERVAL '14 days 20 hours'),
    (6, 15, 8, CURRENT_TIMESTAMP - INTERVAL '14 days 18 hours'),
    (7, 4, 1, CURRENT_TIMESTAMP - INTERVAL '1 day 2 hours'),
    (8, 4, 5, CURRENT_TIMESTAMP - INTERVAL '1 day 1 hour'),
    (9, 4, 7, CURRENT_TIMESTAMP - INTERVAL '1 day 30 minutes'),
    (10, 4, 8, CURRENT_TIMESTAMP - INTERVAL '23 hours'),
    (11, 4, 6, CURRENT_TIMESTAMP - INTERVAL '22 hours'),
    (12, 9, 1, CURRENT_TIMESTAMP - INTERVAL '10 days 4 hours'),
    (13, 9, 2, CURRENT_TIMESTAMP - INTERVAL '10 days 3 hours'),
    (14, 9, 5, CURRENT_TIMESTAMP - INTERVAL '10 days 2 hours'),
    (15, 9, 6, CURRENT_TIMESTAMP - INTERVAL '10 days 1 hour'),
    (16, 9, 7, CURRENT_TIMESTAMP - INTERVAL '9 days 20 hours'),
    (17, 18, 2, CURRENT_TIMESTAMP - INTERVAL '20 days 3 hours'),
    (18, 18, 7, CURRENT_TIMESTAMP - INTERVAL '20 days 2 hours'),
    (19, 18, 8, CURRENT_TIMESTAMP - INTERVAL '20 days 1 hour'),
    (20, 18, 1, CURRENT_TIMESTAMP - INTERVAL '19 days 22 hours'),
    (21, 1, 2, CURRENT_TIMESTAMP - INTERVAL '2 days 1 hour'),
    (22, 1, 4, CURRENT_TIMESTAMP - INTERVAL '2 days 30 minutes'),
    (23, 1, 6, CURRENT_TIMESTAMP - INTERVAL '2 days 20 minutes'),
    (24, 5, 1, CURRENT_TIMESTAMP - INTERVAL '4 days 3 hours'),
    (25, 5, 7, CURRENT_TIMESTAMP - INTERVAL '4 days 2 hours'),
    (26, 5, 8, CURRENT_TIMESTAMP - INTERVAL '4 days 1 hour'),
    (27, 14, 1, CURRENT_TIMESTAMP - INTERVAL '5 days 8 hours'),
    (28, 14, 2, CURRENT_TIMESTAMP - INTERVAL '5 days 7 hours'),
    (29, 14, 6, CURRENT_TIMESTAMP - INTERVAL '5 days 6 hours'),
    (30, 13, 1, CURRENT_TIMESTAMP - INTERVAL '2 days 17 hours'),
    (31, 13, 2, CURRENT_TIMESTAMP - INTERVAL '2 days 16 hours'),
    (32, 2, 4, CURRENT_TIMESTAMP - INTERVAL '5 days 5 hours'),
    (33, 17, 2, CURRENT_TIMESTAMP - INTERVAL '17 days 7 hours'),
    (34, 17, 7, CURRENT_TIMESTAMP - INTERVAL '17 days 6 hours'),
    (35, 3, 2, CURRENT_TIMESTAMP - INTERVAL '8 days 6 hours'),
    (36, 3, 6, CURRENT_TIMESTAMP - INTERVAL '8 days 5 hours'),
    (37, 10, 2, CURRENT_TIMESTAMP - INTERVAL '12 days 6 hours'),
    (38, 20, 1, CURRENT_TIMESTAMP - INTERVAL '6 days 5 hours'),
    (39, 20, 7, CURRENT_TIMESTAMP - INTERVAL '6 days 4 hours'),
    (40, 21, 1, CURRENT_TIMESTAMP - INTERVAL '9 days 4 hours'),
    (41, 22, 2, CURRENT_TIMESTAMP - INTERVAL '3 days 5 hours'),
    (42, 22, 7, CURRENT_TIMESTAMP - INTERVAL '3 days 4 hours'),
    (43, 22, 1, CURRENT_TIMESTAMP - INTERVAL '3 days 3 hours'),
    (44, 23, 2, CURRENT_TIMESTAMP - INTERVAL '11 days 4 hours'),
    (45, 23, 8, CURRENT_TIMESTAMP - INTERVAL '11 days 3 hours'),
    (46, 24, 1, CURRENT_TIMESTAMP - INTERVAL '4 days 5 hours'),
    (47, 24, 7, CURRENT_TIMESTAMP - INTERVAL '4 days 4 hours'),
    (48, 25, 1, CURRENT_TIMESTAMP - INTERVAL '7 days 5 hours'),
    (49, 26, 1, CURRENT_TIMESTAMP - INTERVAL '10 days 5 hours'),
    (50, 26, 6, CURRENT_TIMESTAMP - INTERVAL '10 days 4 hours'),
    (51, 27, 1, CURRENT_TIMESTAMP - INTERVAL '13 days 5 hours'),
    (52, 28, 7, CURRENT_TIMESTAMP - INTERVAL '1 day 5 hours'),
    (53, 28, 1, CURRENT_TIMESTAMP - INTERVAL '1 day 4 hours'),
    (54, 29, 1, CURRENT_TIMESTAMP - INTERVAL '3 days 5 hours'),
    (55, 30, 6, CURRENT_TIMESTAMP - INTERVAL '14 hours'),
    (56, 30, 7, CURRENT_TIMESTAMP - INTERVAL '10 hours'),
    (57, 30, 9, CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- ============================================
-- SEQUENCES
-- ============================================

SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1);
SELECT setval('activities_id_seq', COALESCE((SELECT MAX(id) FROM activities), 0) + 1);
SELECT setval('common_activities_id_seq', COALESCE((SELECT MAX(id) FROM common_activities), 0) + 1);
SELECT setval('friendships_id_seq', COALESCE((SELECT MAX(id) FROM friendships), 0) + 1);
SELECT setval('kudos_id_seq', COALESCE((SELECT MAX(id) FROM kudos), 0) + 1);
