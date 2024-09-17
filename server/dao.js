const db = require("./db");
const crypto = require("crypto");

/*** Database Query Functions ***/
const getUserByUsername = (username) => {
  const sql = "SELECT * FROM users WHERE username = ?";
  return dbGet(sql, [username]);
};

const getUserById = (id) => {
  const sql = "SELECT * FROM users WHERE id = ?";
  return dbGet(sql, [id]);
};

const getAllConcerts = () => {
  const sql = "SELECT * FROM DetailedConcerts";
  return dbAll(sql, []);
};

const getConcertById = (concertId) => {
  const sql = "SELECT * FROM DetailedConcerts WHERE concert_id = ?";
  return dbGet(sql, [concertId]);
};

const insertReservedSeat = (userId, concertId, seat) => {
  const sql =
    "INSERT INTO reserved_seats (user_id, concert_id, seat) VALUES (?, ?, ?)";
  return dbRun(sql, [userId, concertId, seat]);
};

const getReservationsByUserId = (userId) => {
  const sql = "SELECT * FROM Reservations WHERE user_id = ?";
  return dbAll(sql, [userId]);
};

const getReservationByConcertId = (userId, concertId) => {
  const sql = "SELECT * FROM Reservations WHERE user_id = ? AND concert_id = ?";
  return dbGet(sql, [userId, concertId]);
};

const deleteReservationByConcertId = (userId, concertId) => {
  const sql = "DELETE FROM reserved_seats WHERE user_id = ? AND concert_id = ?";
  return dbRun(sql, [userId, concertId]);
};

const reserveSeats = async (userId, concertId, seatsArray) => {
  try {
    await dbRun("BEGIN TRANSACTION");

    for (let seat of seatsArray) {
      await insertReservedSeat(userId, concertId, seat);
    }

    await dbRun("COMMIT");
    return { success: true, seats: seatsArray };
  } catch (err) {
    await dbRun("ROLLBACK");
    return { success: false, error: err.message };
  }
};

/*** Utility Functions ***/
const hashPassword = async (password, salt) => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
};

const dbGet = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const dbAll = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const dbRun = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

module.exports = {
  getUserByUsername,
  getUserById,
  getAllConcerts,
  getConcertById,
  insertReservedSeat,
  getReservationsByUserId,
  getReservationByConcertId,
  deleteReservationByConcertId,
  reserveSeats,
  hashPassword,
};
