// API.js

const RESERVATION_SRV = "http://localhost:3001";
const DISCOUNT_SRV = "http://localhost:3002";

export const checkSession = async () => {
  const url = `${RESERVATION_SRV}/session`;
  const options = {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    mode: "cors",
  };

  const response = await fetch(url, options);

  return response;
};

export const logout = async () => {
  const response = await fetch(`${RESERVATION_SRV}/session`, {
    method: "DELETE",
    credentials: "include",
    mode: "cors",
  });

  return response;
};

export const login = async (username, password) => {
  const url = `${RESERVATION_SRV}/login`;
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
    credentials: "include",
    mode: "cors",
  };
  const response = await fetch(url, options);
  return response;
};

export const getReservations = async () => {
  const response = await fetch(`${RESERVATION_SRV}/reservations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    mode: "cors",
  });

  return response;
};

export const deleteReservation = async (concertId) => {
  const response = await fetch(`${RESERVATION_SRV}/reservation/${concertId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    mode: "cors",
  });

  return response;
};

export const reserveWithSeats = async (concert_id, seats) => {
  const response = await fetch(`${RESERVATION_SRV}/reserve`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    mode: "cors",
    body: JSON.stringify({
      concert_id,
      seats,
    }),
  });

  return response;
};

export const reserveWithHowMany = async (concert_id, howMany) => {
  const response = await fetch(`${RESERVATION_SRV}/reserve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    mode: "cors",
    body: JSON.stringify({
      concert_id,
      howMany,
    }),
  });

  return response;
};

export const getConcerts = async () => {
  const response = await fetch(`${RESERVATION_SRV}/concerts`, {
    method: "GET",
    mode: "cors",
  });
  return response;
};

export const getConcertById = async (concertId) => {
  const response = await fetch(`${RESERVATION_SRV}/concert/${concertId}`, {
    method: "GET",
    mode: "cors",
  });
  return response;
};

export const getReservationByConcertId = async (concertId) => {
  const response = await fetch(`${RESERVATION_SRV}/reservation/${concertId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    mode: "cors",
  });

  return response;
};

export const getAuthToken = async () => {
  const response = await fetch(`${RESERVATION_SRV}/get-token`, {
    credentials: "include",
    mode: "cors",
  });
  return response;
};

export const getDiscount = async (authToken, seats) => {
  const response = await fetch(`${DISCOUNT_SRV}/getDiscount`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ seats }),
    mode: "cors",
  });
  return response;
};
