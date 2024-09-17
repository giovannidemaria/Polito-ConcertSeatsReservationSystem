"use strict";
const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const crypto = require("crypto");
const { check, validationResult } = require("express-validator");
const morgan = require("morgan");
const cors = require("cors");
const dao = require("./dao");
const dayjs = require("dayjs");

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};

/*** Utility Functions ***/

const hashPassword = async (password, salt) => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
};

const generateRandomSeats = (howMany, rows, cols, reservedSeats) => {
  const availableSeats = [];
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const seat = `${row}${String.fromCharCode(64 + col)}`;
      availableSeats.push(seat);
    }
  }

  const freeSeats = availableSeats.filter(
    (seat) => !reservedSeats.includes(seat)
  );

  if (freeSeats.length < howMany) {
    return -1;
  }

  const selectedSeats = [];
  while (selectedSeats.length < howMany) {
    const randomIndex = Math.floor(Math.random() * freeSeats.length);
    selectedSeats.push(freeSeats.splice(randomIndex, 1)[0]);
  }

  return selectedSeats;
};

/*** Passport Configuration ***/
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await dao.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Invalid username or password." });
      }

      const hashedPassword = await hashPassword(password, user.salt);
      if (hashedPassword !== user.hashed_pwd) {
        return done(null, false, { message: "Invalid username or password." });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await dao.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

/*** Middleware ***/

const session = require("express-session");
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "w7]H9C>p}gL*UqJ@2fY&v$Zs#kB8R3N4eMxT1yPd!aX0o^Sz",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
    },
  })
);

app.use(passport.authenticate("session"));

/*** Authentication Middleware ***/
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Not authenticated" });
};

/*** Routes ***/

// CORS preflight response
app.options("*", cors(corsOptions));

// POST /login
app.post("/login", async (req, res, next) => {
  try {
    passport.authenticate("local", (err, user) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Login failed" });

      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.status(200).json({
          username: user.username,
          user_id: user.id,
          displayed_name: user.displayed_name,
        });
      });
    })(req, res, next);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /session
app.get("/session", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({
      username: req.user.username,
      user_id: req.user.id,
      displayed_name: req.user.displayed_name,
    });
  } else res.status(401).json({ error: "Not authenticated" });
});

// DELETE /session
app.delete("/session", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// GET /concerts
app.get("/concerts", async (req, res) => {
  try {
    const concerts = await dao.getAllConcerts();

    const mappedConcerts = concerts.map((concert) => ({
      concert_id: concert.concert_id,
      concert_name: concert.concert_name,
      concert_date: dayjs(concert.concert_date),
      theater_name: concert.theater_name,
      theater_rows: concert.theater_rows,
      theater_cols: concert.theater_cols,
      theater_size: concert.theater_size,
      reserved_seats: concert.reserved_seats
        ? concert.reserved_seats.split(",")
        : [],
    }));

    res.status(200).json(mappedConcerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /concert/:id
app.get("/concert/:id", [check("id").isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const concert = await dao.getConcertById(req.params.id);

    if (!concert) {
      return res.status(404).json({ error: "Concert not found" });
    }

    const mappedConcert = {
      concert_id: concert.concert_id,
      concert_name: concert.concert_name,
      concert_date: dayjs(concert.concert_date),
      theater_name: concert.theater_name,
      theater_rows: concert.theater_rows,
      theater_cols: concert.theater_cols,
      theater_size: concert.theater_size,
      reserved_seats: concert.reserved_seats
        ? concert.reserved_seats.split(",")
        : [],
    };

    res.status(200).json(mappedConcert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reserve (for dynamic seat reservation with howMany)
app.post(
  "/reserve",
  [
    check("concert_id").isInt({ min: 1 }),
    check("howMany").isInt({ min: 1 }).notEmpty(),
  ],
  isLoggedIn,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { concert_id, howMany } = req.body;

    try {
      // Get theater size
      const concert = await dao.getConcertById(concert_id);

      if (!concert) {
        return res.status(400).json({ error: "Concert or theater not found" });
      }

      // Generate random seats
      const generatedSeats = generateRandomSeats(
        howMany,
        concert.theater_rows,
        concert.theater_cols,
        concert.reserved_seats.split(",")
      );

      if (generatedSeats === -1) {
        return res.status(400).json({ error: "Not enough available seats" });
      }

      const result = await dao.reserveSeats(
        req.user.id,
        concert_id,
        generatedSeats
      );
      if (result.success) {
        res
          .status(201)
          .json({ message: "Reservation successful", seats: result.seats });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      if (err.message.includes("SQLITE_CONSTRAINT: UNIQUE constraint failed")) {
        res
          .status(400)
          .json({ message: "Seats already reserved", error: err.message });
      } else {
        res
          .status(500)
          .json({ message: "Reservation failed", error: err.message });
      }
    }
  }
);

// PUT /reserve (for specific seat reservations)
app.put(
  "/reserve",
  [check("concert_id").isInt({ min: 1 }), check("seats").isArray().notEmpty()],
  isLoggedIn,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { concert_id, seats } = req.body;
    let seatsArray = seats || [];

    try {
      // Get theater size
      const concert = await dao.getConcertById(concert_id);

      if (!concert) {
        return res.status(400).json({ error: "Concert or theater not found" });
      }

      // Validate each seat format
      const seatFormat = /^[1-9][0-9]*[A-Z]$/;
      for (let seat of seatsArray) {
        if (!seatFormat.test(seat)) {
          return res
            .status(422)
            .json({ error: `Invalid seat format: ${seat}` });
        }

        const rowNumber = parseInt(seat.slice(0, -1), 10);
        const columnLetter = seat.slice(-1);
        const columnNumber = columnLetter.charCodeAt(0) - "A".charCodeAt(0) + 1;
        // Check if seat is out of bounds
        if (
          rowNumber < 1 ||
          rowNumber > concert.theater_rows ||
          columnNumber < 1 ||
          columnNumber > concert.theater_cols
        ) {
          return res.status(400).json({
            error: `Seat ${seat} is out of bounds for theater size ${concert.theater_rows}x${concert.theater_cols}`,
          });
        }
      }

      const reservedSeats = (
        await dao.getConcertById(concert_id)
      ).reserved_seats.split(","); // I fetch the reserved seats at the last possible moment to ensure the data is up-to-date and to minimize the chances of triggering the catch block, even though this approach is less efficient.

      if (seatsArray.some((seat) => reservedSeats.includes(seat))) {
        return res.status(400).json({ message: "Seats already reserved" });
      }

      // Proceed with reservation
      const result = await dao.reserveSeats(
        req.user.id,
        concert_id,
        seatsArray
      );
      if (result.success) {
        res
          .status(201)
          .json({ message: "Reservation successful", seats: result.seats });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      if (err.message.includes("SQLITE_CONSTRAINT: UNIQUE constraint failed")) {
        res.status(400).json({ message: "Seats already reserved" });
      } else {
        res
          .status(500)
          .json({ message: "Reservation failed", error: err.message });
      }
    }
  }
);

// GET /reservations
app.get("/reservations", isLoggedIn, async (req, res) => {
  try {
    const reservations = await dao.getReservationsByUserId(req.user.id);
    const mappedReservations = reservations.map((reservation) => ({
      user_id: reservation.user_id,
      username: reservation.username,
      concert_id: reservation.concert_id,
      concert_name: reservation.concert_name,
      concert_date: reservation.concert_date,
      theater_name: reservation.theater_name,
      theater_rows: reservation.theater_rows,
      theater_cols: reservation.theater_cols,
      reserved_seats: reservation.reserved_seats.split(","),
    }));

    res.status(200).json(mappedReservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /reservation/:concertId
app.delete(
  "/reservation/:concertId",
  [check("concertId").isInt({ min: 1 }).withMessage("Invalid concert ID")],
  isLoggedIn,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const concert_id = req.params.concertId;

    try {
      const result = await dao.deleteReservationByConcertId(
        req.user.id,
        concert_id
      );
      if (result.changes === 0) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      // Successfully deleted the reservation
      return res
        .status(200)
        .json({ message: "Reservation deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.get(
  "/reservation/:concertId",
  [check("concertId").isInt({ min: 1 })],
  isLoggedIn,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const reservation = await dao.getReservationByConcertId(
        req.user.id,
        req.params.concertId
      );
      if (reservation) {
        const mappedReservation = {
          user_id: reservation.user_id,
          username: reservation.username,
          concert_id: reservation.concert_id,
          concert_name: reservation.concert_name,
          concert_date: dayjs(reservation.concert_date),
          theater_name: reservation.theater_name,
          theater_rows: reservation.theater_rows,
          theater_cols: reservation.theater_cols,
          reserved_seats: reservation.reserved_seats.split(","),
        };
        res.status(200).json(mappedReservation);
      } else {
        res.status(404).json({ error: "Reservation not found" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

const jsonwebtoken = require("jsonwebtoken");
const jwtSecret =
  "qTX6walIEr47p7iXtTgLxDTXJRZYDC9egFjGLIn0rRiahB4T24T4d5f59CtyQmH8";

const expireTime = 60; //seconds

app.get("/get-token", isLoggedIn, (req, res) => {
  try {
    const isLoyal = req.user.loyal === 1;
    const payloadToSign = {
      user_id: req.user.id,
      username: req.user.username,
      loyal: isLoyal,
    };

    const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, {
      expiresIn: expireTime,
    });
    res.status(200).json({ token: jwtToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*** Start Server ***/
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});
