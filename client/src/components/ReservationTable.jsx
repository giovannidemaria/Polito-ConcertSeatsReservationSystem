import React, { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";
import { getReservations, deleteReservation } from "../API.js";
import { FaTrash } from "react-icons/fa";
import dayjs from "dayjs";
const ReservationTable = () => {
  const [reservations, setReservations] = useState([]); // State to store the list of reservations
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [error, setError] = useState(null); // State to manage error state

  // Fetch reservations on component mount
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const result = await getReservations();
        if (!result.ok) {
          throw new Error(
            "Server sent a response with the following error: " +
              result.statusText
          );
        }
        const reservations = await result.json();
        setReservations(reservations);
        setLoading(false);
      } catch (err) {
        setError("fetchReservations error: " + err.message);
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleDelete = async (concertId) => {
    try {
      const result = await deleteReservation(concertId);
      if (result.ok) {
        setReservations(
          reservations.filter((res) => res.concert_id !== concertId)
        );
      } else {
        throw new Error(
          "Server sent a response with the following error" + result.statusText
        );
      }
    } catch (err) {
      setError("handleDelete error: " + err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (reservations.length === 0) {
    return <div>You have no reservations at the moment.</div>; // Display message if no reservations
  }

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>#</th>
          <th>Concert Name</th>
          <th>Concert ID</th>
          <th>Concert Date</th>
          <th>Theater Name</th>
          <th>Seat Numbers</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map((reservation, index) => (
          <tr key={reservation.concert_id}>
            <td>{index + 1}</td>
            <td>{reservation.concert_name}</td>
            <td>{reservation.concert_id}</td>
            <td>{dayjs(reservation.concert_date).format("YYYY-MM-DD")}</td>
            <td>{reservation.theater_name}</td>
            <td>{reservation.reserved_seats.join(", ")}</td>
            <td>
              <Button
                variant="danger"
                onClick={() => handleDelete(reservation.concert_id)}
              >
                <FaTrash /> {/* Trash bin icon */}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ReservationTable;
