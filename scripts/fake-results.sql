update matches set home_score = floor(random()*4)::int, away_score = floor(random()*4)::int, status = 'finished' where stage = 'group';
