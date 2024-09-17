import React, { useEffect, useState } from "react";
import { Form, Button, Container, Modal, Alert } from "react-bootstrap";
import {
  reserveWithHowMany,
  getReservationByConcertId,
  getConcertById,
} from "../API";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { calculateAvailableSeats } from "../ConcertStatsUtils.js";

const AutomaticSeatsReserver = ({
  concert,
  setConcert,
  onSeatSelectionChange,
  selectedSeatsCount,
}) => {
  const navigate = useNavigate(); // Hook to navigate between routes
  const [maxSeats, setMaxSeats] = useState(); // State to store the maxSeats value
  const [showModal, setShowModal] = useState(false); // State to control the visibility of the modal and error message
  const [reservationErrorMessage, setreservationErrorMessage] = useState("");
  const [error, setError] = useState("");

  // When the concert changes, reset the requested seats count and calculate the max seats
  useEffect(() => {
    onSeatSelectionChange(0);
    setMaxSeats(calculateAvailableSeats(concert));
  }, [concert]);

  const handleselectedSeatsCountChange = (event) => {
    let value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      if (value > maxSeats) {
        value = maxSeats; // Cap the value to the maxSeats
      } else if (value < 0) {
        value = 0; // Default to 0 for invalid input
      }
      onSeatSelectionChange(value);
    } else {
      onSeatSelectionChange(0);
    }
  };

  const handleSeatsError = (availableSeats) => {
    // Set error message first
    setreservationErrorMessage(
      `Not enough seats available. New available seats counter: ${availableSeats}`
    );

    // Then show the modal
    setShowModal(true);
  };

  const handleCloseAlert = () => {
    setError(null);
  };

  const onSubmit = async (event) => {
    try {
      event.preventDefault();
      const result = await reserveWithHowMany(
        concert.concert_id,
        selectedSeatsCount
      );
      if (result.ok) {
        const result2 = await getReservationByConcertId(concert.concert_id);

        if (!result2.ok) {
          throw new Error("Failed to fetch reservation");
        }
        const fetchedReservation = await result2.json();
        const reservation = {
          concert_id: concert.concert_id,
          concert_name: concert.concert_name,
          concert_date: dayjs(concert.date).format("YYYY-MM-DD"),
          theater: concert.theater_name,
          reserved_seats: fetchedReservation.reserved_seats,
        };

        navigate("/reserved-area/confirmed", {
          state: { reservation },
        });
      } else if (result.status === 400) {
        // Reservation failed: in the meantime someone else reserved the seats
        const concertResult = await getConcertById(concert.concert_id);
        if (!concertResult.ok) {
          throw new Error("Failed to fetch concert");
        }
        const concertWithUpdatedSeats = await concertResult.json();
        if (!concertWithUpdatedSeats) {
          throw new Error("Failed to fetch concert");
        }
        setConcert(concertWithUpdatedSeats);
        const availableSeats = calculateAvailableSeats(concertWithUpdatedSeats);
        setMaxSeats(availableSeats);
        handleSeatsError(availableSeats);
      } else {
        throw new Error(
          `Server sent a response with the following error: ${result.statusText}`
        );
      }
    } catch (error) {
      setError(`Automatic reserve failed: ${error.message}`);
    }
  };

  return (
    <>
      <Container>
        <h5 className="my-4">Automatic Seats Reservation System</h5>
        <p>
          To proceed with the reservation, please indicate how many seats you
          want to reserve.
        </p>
        <Form onSubmit={onSubmit}>
          <Form.Group controlId="selectedSeatsCount">
            <Form.Label>Number of Seats</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max={maxSeats}
              value={selectedSeatsCount}
              onChange={handleselectedSeatsCountChange}
            />
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            className="mt-3"
            disabled={!concert || selectedSeatsCount === 0}
          >
            Reserve seats (Automatic reservation)
          </Button>
        </Form>
        {error && (
          <Alert variant="danger" onClose={handleCloseAlert} dismissible>
            {error}
          </Alert>
        )}
      </Container>

      {/* Modal for displaying error message */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reservation Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{reservationErrorMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AutomaticSeatsReserver;
