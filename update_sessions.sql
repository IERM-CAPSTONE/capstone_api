UPDATE "ExamSession"
SET 
    "examOpenTime" = NOW() - INTERVAL '30 minutes',
    "examCloseTime" = NOW() + INTERVAL '90 minutes',
    "status" = 'Ongoing' -- Ép trạng thái sang Ongoing luôn
WHERE id IN (
    SELECT MIN(id)
    FROM "ExamSession"
    WHERE "campus" = 'DN'
    GROUP BY "subjectCode"
    LIMIT 10
);
