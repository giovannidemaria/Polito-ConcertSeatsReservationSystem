"use strict";
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const { body, validationResult } = require("express-validator");

const { expressjwt: jwt } = require("express-jwt");

const jwtSecret =
  "qTX6walIEr47p7iXtTgLxDTXJRZYDC9egFjGLIn0rRiahB4T24T4d5f59CtyQmH8";

const app = new express();
const port = 3002;

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

/*** Middleware ***/

app.use(morgan("dev"));
app.use(express.json());

app.use(
  jwt({
    secret: jwtSecret,
    algorithms: ["HS256"],
  })
);

app.post(
  "/getDiscount",
  body("seats")
    .isArray()
    .notEmpty()
    .withMessage("Seats are required and must be a non-empty string"),
  (req, res) => {
    const seats = req.body.seats;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const seatFormat = /^[1-9][0-9]*[A-Z]$/;
    for (let s of seats) {
      if (!seatFormat.test(s)) {
        return res.status(422).json({ error: `Invalid seat format: ${s}` });
      }
    }

    try {
      const loyal = req.auth.loyal;
      const discount = calculateDiscount(loyal, seats);

      res.status(200).json({ discount: discount });
    } catch (err) {
      return res.status(401).json({ error: `Invalid token. error: ${err}` });
    }
  }
);

const calculateDiscount = (loyal, seats) => {
  const rowSum = seats.reduce(
    (sum, seat) => sum + parseInt(seat.match(/\d+/)[0]),
    0
  );
  let discount = loyal ? rowSum : rowSum / 3;
  discount += Math.random() * 15 + 5;
  return Math.max(5, Math.min(50, Math.round(discount)));
};

/*** Start Server ***/
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
