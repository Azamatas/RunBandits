SELECT
    a.id,
    a.title,
    a.sport_type,
    u.username                                                              AS athlete,
    ROUND((a.distance / 1000.0)::numeric, 2)                              AS distance_km,
    TO_CHAR((a.duration || ' seconds')::INTERVAL, 'HH24:MI:SS')           AS duration,
    a.started_at::DATE                                                     AS date,
    COUNT(k.id)                                                            AS kudos
FROM activities a
JOIN users u ON u.id = a.owner_id
LEFT JOIN kudos k ON k.activity_id = a.id
WHERE
    a.owner_id = 1001
    OR (
        a.visibility = 'public'
        AND a.owner_id IN (
            SELECT addressee_id FROM friendships WHERE requester_id = 1001 AND status = 'accepted'
            UNION
            SELECT requester_id FROM friendships WHERE addressee_id = 1001 AND status = 'accepted'
        )
    )
GROUP BY a.id, a.title, a.sport_type, u.username, a.distance, a.duration, a.started_at
ORDER BY a.started_at DESC;


SELECT
    u.username,
    a.title,
    TO_CHAR((a.duration || ' seconds')::INTERVAL, 'MI:SS')              AS time,
    ROUND(ST_FrechetDistance(ca.path, a.path, 0.05)::numeric)           AS route_deviation_m,
    RANK() OVER (PARTITION BY u.id ORDER BY a.duration)                 AS personal_rank
FROM common_activities ca
JOIN activities a ON a.common_activity_id = ca.id
JOIN users u ON u.id = a.owner_id
WHERE
    ca.id = 1001
    AND a.duration IS NOT NULL
ORDER BY a.duration;
