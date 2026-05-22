DELETE FROM activity_athletes;
DELETE FROM kudos;
DELETE FROM segment_efforts;
DELETE FROM friendships;
DELETE FROM activities;
DELETE FROM segments;
DELETE FROM common_activities;
DELETE FROM users WHERE username IN ('alex_runs','marina_k','swift_leo','trailblazer','ironmike','velocity_v','peak_petra','urban_finn');

INSERT INTO users (id, username, email, password_hash, bio, location) OVERRIDING SYSTEM VALUE VALUES
  (1001, 'alex_runs',   'alex_runs@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqRmWvRmOBkzP3dUFkU5wVbGe2', 'Entire discussion read soldier suffer.',                    'Meganbury'),
  (1002, 'marina_k',    'marina_k@example.com',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqRmWvRmOBkzP3dUFkU5wVbGe2', 'Argue interview door trial hotel science heavy analysis.',  'Ginaborough'),
  (1003, 'swift_leo',   'swift_leo@example.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqRmWvRmOBkzP3dUFkU5wVbGe2', 'Job wife ask meeting the during participant girl.',         'North Cassandra'),
  (1004, 'trailblazer', 'trailblazer@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqRmWvRmOBkzP3dUFkU5wVbGe2', 'Start I beyond other live popular vote.',                  'South Nancymouth'),
  (1005, 'ironmike',    'ironmike@example.com',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqRmWvRmOBkzP3dUFkU5wVbGe2', 'Day provide put physical bed.',                            'Port Gregorymouth'),
  (1006, 'velocity_v',  'velocity_v@example.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqRmWvRmOBkzP3dUFkU5wVbGe2', 'Week bad sea eye product century current.',                'Aaronberg'),
  (1007, 'peak_petra',  'peak_petra@example.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqRmWvRmOBkzP3dUFkU5wVbGe2', 'Begin skin loss those song.',                              'Lake Cory'),
  (1008, 'urban_finn',  'urban_finn@example.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGqRmWvRmOBkzP3dUFkU5wVbGe2', 'Let deal recently movement no any TV gas.',                'Hubbardfort');

INSERT INTO common_activities (id, name, sport_type, polyline, distance) OVERRIDING SYSTEM VALUE VALUES
  (1001, 'Vondelpark Loop',      'run', 'yvvqHmcagAiBSgAEw@Eq@As@Am@A_@Am@Am@Cs@Mw@Sm@Wy@a@q@a@s@g@_@[OSMS', 3800),
  (1002, 'Amstel River Run',     'run', 'sv{qHysagAb@Ij@Kn@Gl@Ep@An@?j@?l@Bj@Fh@Hf@Ll@Tf@Rd@Pb@N`@L^J',    5200),
  (1003, 'Sarphatipark Circuit', 'run', 'evxqH{bagAF[Bu@?q@Cy@Iq@Mm@Sq@Ym@_@i@g@e@k@]o@Ue@Me@Ii@Ei@Ci@A',  2100);

INSERT INTO activities (id, owner_id, title, sport_type, distance, duration, polyline, visibility, started_at, common_activity_id) OVERRIDING SYSTEM VALUE VALUES
  (2001, 1001, 'Morning Vondelpark', 'run',  3820,  1140, 'yvvqHmcagAiBSgAEw@Eq@As@Am@A_@Am@Am@Cs@Mw@Sm@Wy@a@q@a@s@g@_@[OSMS', 'public',  '2024-03-01 07:15:00+01', 1001),
  (2002, 1002, 'Vondelpark Easy',    'run',  3790,  1320, 'yvvqHmcagAiBSgAEw@Eq@As@Am@A_@Am@Am@Cs@Mw@Sm@Wy@a@q@a@s@g@_@[OSMS', 'public',  '2024-03-02 08:00:00+01', 1001),
  (2003, 1003, 'Fast Vondelpark',    'run',  3810,   980, 'yvvqHmcagAiBSgAEw@Eq@As@Am@A_@Am@Am@Cs@Mw@Sm@Wy@a@q@a@s@g@_@[OSMS', 'public',  '2024-03-03 06:45:00+01', 1001),
  (2004, 1004, 'Vondelpark Tempo',   'run',  3800,  1050, 'yvvqHmcagAiBSgAEw@Eq@As@Am@A_@Am@Am@Cs@Mw@Sm@Wy@a@q@a@s@g@_@[OSMS', 'friends', '2024-03-04 07:30:00+01', 1001),
  (2005, 1005, 'Amstel Long Run',    'run',  5210,  1980, 'sv{qHysagAb@Ij@Kn@Gl@Ep@An@?j@?l@Bj@Fh@Hf@Ll@Tf@Rd@Pb@N`@L^J',    'public',  '2024-03-05 09:00:00+01', 1002),
  (2006, 1006, 'Amstel Intervals',   'run',  5180,  1740, 'sv{qHysagAb@Ij@Kn@Gl@Ep@An@?j@?l@Bj@Fh@Hf@Ll@Tf@Rd@Pb@N`@L^J',    'public',  '2024-03-06 07:00:00+01', 1002),
  (2007, 1001, 'Amstel Sunday',      'run',  5220,  2100, 'sv{qHysagAb@Ij@Kn@Gl@Ep@An@?j@?l@Bj@Fh@Hf@Ll@Tf@Rd@Pb@N`@L^J',    'public',  '2024-03-07 10:00:00+01', 1002),
  (2008, 1002, 'Sarphati Loop',      'run',  2110,   660, 'evxqH{bagAF[Bu@?q@Cy@Iq@Mm@Sq@Ym@_@i@g@e@k@]o@Ue@Me@Ii@Ei@Ci@A',  'public',  '2024-03-08 06:30:00+01', 1003),
  (2009, 1003, 'Sarphati Recovery',  'run',  2090,   720, 'evxqH{bagAF[Bu@?q@Cy@Iq@Mm@Sq@Ym@_@i@g@e@k@]o@Ue@Me@Ii@Ei@Ci@A',  'public',  '2024-03-09 07:00:00+01', 1003),
  (2010, 1007, 'City Bike Ride',     'ride', 22000, 3600, NULL, 'public',  '2024-03-10 14:00:00+01', NULL),
  (2011, 1008, 'Evening Walk',       'walk',  4500, 2700, NULL, 'public',  '2024-03-11 18:00:00+01', NULL),
  (2012, 1001, 'Trail Hike',         'hike', 14000, 5400, NULL, 'private', '2024-03-12 09:00:00+01', NULL);

INSERT INTO segments (id, name, polyline, distance) OVERRIDING SYSTEM VALUE VALUES
  (3001, 'Vondelpark Sprint',   'yvvqHmcagAiBSgAEw@Eq@As@Am@A_@Am@',             800),
  (3002, 'Amstel Bridge Climb', 'sv{qHysagAb@Ij@Kn@Gl@Ep@An@?j@?l@Bj@Fh@H',   1200);

INSERT INTO segment_efforts (segment_id, activity_id, athlete_id, elapsed_time, started_at) VALUES
  (3001, 2001, 1001, 195, '2024-03-01 07:18:00+01'),
  (3001, 2002, 1002, 224, '2024-03-02 08:04:00+01'),
  (3001, 2003, 1003, 178, '2024-03-03 06:48:00+01'),
  (3001, 2004, 1004, 201, '2024-03-04 07:33:00+01'),
  (3002, 2005, 1005, 312, '2024-03-05 09:10:00+01'),
  (3002, 2006, 1006, 287, '2024-03-06 07:12:00+01'),
  (3002, 2007, 1001, 334, '2024-03-07 10:15:00+01');

INSERT INTO friendships (requester_id, addressee_id, status) VALUES
  (1001, 1002, 'accepted'),
  (1001, 1003, 'accepted'),
  (1002, 1004, 'accepted'),
  (1003, 1005, 'accepted'),
  (1004, 1006, 'accepted'),
  (1005, 1007, 'accepted'),
  (1006, 1008, 'accepted'),
  (1007, 1001, 'accepted'),
  (1002, 1008, 'accepted'),
  (1003, 1006, 'accepted');

INSERT INTO kudos (activity_id, user_id) VALUES
  (2001, 1002),
  (2001, 1003),
  (2002, 1001),
  (2003, 1001),
  (2003, 1002),
  (2004, 1005),
  (2005, 1001),
  (2005, 1006),
  (2006, 1003),
  (2007, 1004),
  (2008, 1001),
  (2009, 1002);

INSERT INTO activity_athletes (activity_id, user_id) VALUES
  (2005, 1002),
  (2005, 1003),
  (2007, 1004);
