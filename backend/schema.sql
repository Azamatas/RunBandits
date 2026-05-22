CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE sport_type AS ENUM ('run', 'ride', 'walk', 'hike');
CREATE TYPE visibility  AS ENUM ('public', 'friends', 'private');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted');

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio           TEXT,
    location      VARCHAR(100),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE common_activities (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    sport_type sport_type   NOT NULL,
    polyline   TEXT,
    path       GEOMETRY(LineString, 3857),  -- Web Mercator, metres
    distance   FLOAT
);

CREATE TABLE activities (
    id                 SERIAL PRIMARY KEY,
    owner_id           INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title              VARCHAR(200) NOT NULL,
    sport_type         sport_type   NOT NULL,
    distance           FLOAT,            -- metres
    duration           INTEGER,          -- seconds
    polyline           TEXT,             -- encoded Google polyline
    path               GEOMETRY(LineString, 3857),
    visibility         visibility DEFAULT 'public',
    started_at         TIMESTAMP WITH TIME ZONE,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    common_activity_id INTEGER REFERENCES common_activities(id)
);

CREATE TABLE segments (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    sport_type sport_type   NOT NULL,
    polyline   TEXT,
    path       GEOMETRY(LineString, 3857),
    distance   FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE segment_efforts (
    id           SERIAL PRIMARY KEY,
    segment_id   INTEGER NOT NULL REFERENCES segments(id)    ON DELETE CASCADE,
    activity_id  INTEGER NOT NULL REFERENCES activities(id)  ON DELETE CASCADE,
    athlete_id   INTEGER NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    elapsed_time INTEGER NOT NULL,  -- seconds
    started_at   TIMESTAMP WITH TIME ZONE,
    UNIQUE (segment_id, activity_id)
);

CREATE TABLE friendships (
    id           SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       friendship_status DEFAULT 'pending',
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (requester_id, addressee_id)
);

CREATE TABLE kudos (
    id          SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (activity_id, user_id)
);

CREATE TABLE activity_athletes (
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    PRIMARY KEY (activity_id, user_id)
);



CREATE INDEX idx_activities_owner_id   ON activities(owner_id);
CREATE INDEX idx_activities_started_at ON activities(started_at);
CREATE INDEX idx_activities_visibility ON activities(visibility);
CREATE INDEX idx_activities_common     ON activities(common_activity_id);

CREATE INDEX idx_activities_path        ON activities        USING GIST(path);
CREATE INDEX idx_common_activities_path ON common_activities USING GIST(path);
CREATE INDEX idx_segments_path          ON segments          USING GIST(path);

CREATE INDEX idx_friendships_requester  ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee  ON friendships(addressee_id);
CREATE INDEX idx_kudos_activity         ON kudos(activity_id);
CREATE INDEX idx_kudos_user             ON kudos(user_id);
CREATE INDEX idx_efforts_segment        ON segment_efforts(segment_id);
CREATE INDEX idx_efforts_athlete        ON segment_efforts(athlete_id);
CREATE INDEX idx_efforts_activity       ON segment_efforts(activity_id);
