-- There is a potential issue with foreign key dependencies during the creation of the database usign this sql file. 

create table theaters
(
    id   integer not null
        constraint theather_pk
            primary key autoincrement,
    name text,
    rows integer,
    cols integer,
    size text
);

create table concerts
(
    id         integer not null
        constraint concert_pk
            primary key autoincrement,
    name       text,
    theater_id INTEGER
        constraint concert_theather_id_fk
            references theaters,
    date       text
);

create table users
(
    id             integer           not null
        constraint users_pk
            primary key autoincrement,
    username       text              not null,
    hashed_pwd     text,
    salt           text,
    loyal          integer default 0 not null,
    displayed_name text,
    check ("users".loyal IN (0, 1))
);

create table reserved_seats
(
    user_id    integer
        constraint rs_users_id_fk
            references users,
    concert_id integer
        constraint rs_concert_id_fk
            references concerts,
    seat       text,
    constraint rs_pk
        primary key (concert_id, seat)
);

create unique index username_unique
    on users (username);

CREATE VIEW DetailedConcerts AS
SELECT
    c.id AS concert_id,
    c.name AS concert_name,
    c.date AS concert_date,
    t.name AS theater_name,
    t.rows AS theater_rows,
    t.cols AS theater_cols,
    t.size AS theater_size,
    IFNULL(rs.occupied_seats, '') AS reserved_seats
FROM
    concerts c
JOIN
    theaters t ON c.theater_id = t.id
LEFT JOIN
    (
        SELECT
            concert_id,
            GROUP_CONCAT(seat ORDER BY seat ASC) AS occupied_seats
        FROM
            reserved_seats
        GROUP BY
            concert_id
    ) rs ON c.id = rs.concert_id;

CREATE VIEW Reservations AS
SELECT
    u.id AS user_id,
    u.username AS username,
    c.id AS concert_id,
    c.name AS concert_name,
    c.date AS concert_date,
    th.name AS theater_name,
    th.rows AS theater_rows,
    th.cols AS theater_cols,
    GROUP_CONCAT(rs.seat ORDER BY rs.seat ASC) AS reserved_seats
FROM
    users u
JOIN
    reserved_seats rs ON u.id = rs.user_id
JOIN
    concerts c ON rs.concert_id = c.id
JOIN
    theaters th ON c.theater_id = th.id
GROUP BY
    u.id, u.username, c.name, c.date, th.name, th.rows, th.cols
ORDER BY
    u.username ASC;



INSERT INTO concerts (id, name, theater_id, date) VALUES (1, 'Rock Fest 2024', 4, '2024-09-30');
INSERT INTO concerts (id, name, theater_id, date) VALUES (2, 'Jazz Night', 3, '2024-10-05');
INSERT INTO concerts (id, name, theater_id, date) VALUES (3, 'The Marriage of Figaro', 1, '2024-11-20');
INSERT INTO concerts (id, name, theater_id, date) VALUES (4, 'Classical Harmony', 1, '2024-12-01');
INSERT INTO concerts (id, name, theater_id, date) VALUES (5, 'Electronic Beats', 4, '2024-12-15');
INSERT INTO concerts (id, name, theater_id, date) VALUES (6, 'Pop Extravaganza', 2, '2025-01-10');
INSERT INTO concerts (id, name, theater_id, date) VALUES (7, 'Reggae Nights', 2, '2025-02-20');
INSERT INTO concerts (id, name, theater_id, date) VALUES (8, 'Rhapsody Of Fire Tour', 4, '2025-03-05');

INSERT INTO reserved_seats (user_id, concert_id, seat) VALUES (1, 1, '1A');
INSERT INTO reserved_seats (user_id, concert_id, seat) VALUES (1, 1, '1B');
INSERT INTO reserved_seats (user_id, concert_id, seat) VALUES (1, 2, '1A');
INSERT INTO reserved_seats (user_id, concert_id, seat) VALUES (1, 2, '1B');
INSERT INTO reserved_seats (user_id, concert_id, seat) VALUES (3, 1, '2A');
INSERT INTO reserved_seats (user_id, concert_id, seat) VALUES (3, 1, '2B');
INSERT INTO reserved_seats (user_id, concert_id, seat) VALUES (3, 2, '2A');
INSERT INTO reserved_seats (user_id, concert_id, seat) VALUES (3, 2, '2B');

INSERT INTO theaters (id, name, rows, cols, size) VALUES (1, 'Teatro Regio Turin', 6, 10, 'medium');
INSERT INTO theaters (id, name, rows, cols, size) VALUES (2, 'Verona Arena', 9, 14, 'large');
INSERT INTO theaters (id, name, rows, cols, size) VALUES (3, 'Symphony Hall', 4, 8, 'small');
INSERT INTO theaters (id, name, rows, cols, size) VALUES (4, 'Rock Arena', 9, 14, 'large');

INSERT INTO users (id, username, hashed_pwd, salt, loyal, displayed_name) VALUES (1, 'emusk', 'd40add516bdd0b071a61a8a343359aaed3d558759771155df5347f17b3c1e500c5954bb776a081f0ec14767dc2b3cbdae025fa304cb00d04b52422bf95769125', 'ec52d6c5a7f0d3aed8c57a098482ee2f', 1, 'Elon Musk');
INSERT INTO users (id, username, hashed_pwd, salt, loyal, displayed_name) VALUES (2, 'sjobs', 'b6bff60c504b3f7d13e9fa2d9d6c4d0a229f0f4f1fdfc66c5d504bf74dd8c5c2ee336d820ad3c93927a69916882044b4079542b733e3ac09efee392205488aaa', 'c082d94c80efa4dc0fa9173d17d35643', 1, 'Steve Jobs');
INSERT INTO users (id, username, hashed_pwd, salt, loyal, displayed_name) VALUES (3, 'cbrown', 'd5e98845f10734825f9fd83a88a93875bcee0a6fcddc7df13176ccd625b65314d9d7a24df59cd14520c7d4031f71356cfcc7f97dcce04d06c14c678897437da1', 'e46bea927d77f3454e0377849a564647', 0, 'Charlie Brown');
INSERT INTO users (id, username, hashed_pwd, salt, loyal, displayed_name) VALUES (4, 'gdemaria', '0c436f914be6dcae0cfa00b02545004f3b379757408d91f02a081e3df26f6348aeff2f4ca8f886f7c7c51239715bac301bbb153f89c6185f8b28e9d8b100d484', '4044cb9fac11e4ffc72602bb155f1cc9', 0, 'Giovanni de Maria');
