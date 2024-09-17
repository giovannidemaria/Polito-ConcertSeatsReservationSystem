import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Container, Badge, Button, Modal, Alert } from "react-bootstrap";
import { reserveWithSeats, getConcertById } from "../API.js";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const SeatsManager = ({
  concert,
  setConcert = () => {},
  mode,
  onSeatSelectionChange = () => {},
}) => {
  const navigate = useNavigate(); // Hook to navigate between routes

  const [selectedSeats, setSelectedSeats] = useState([]); // State to store requested seats
  const [highlightedSeats, setHighlightedSeats] = useState([]); // State for seats that become occupied
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [reservationSummary, setReservationSummary] = useState(""); // State for reservation summary
  const [error, setError] = useState(null); // State to manage error state

  // Notify parent component whenever the requested seats change
  useEffect(() => {
    onSeatSelectionChange(selectedSeats.length);
  }, [selectedSeats]);

  // Generate the seats array based on the concert data
  const seats = useMemo(() => {
    if (!concert) {
      return [];
    }

    const {
      theater_rows: rows,
      theater_cols: cols,
      reserved_seats: reservedSeatsArr,
    } = concert;

    const reservedSeats = new Set(reservedSeatsArr);
    const seatArray = Array.from({ length: rows * cols }, (_, index) => {
      const row = Math.floor(index / cols) + 1;
      const col = (index % cols) + 1;
      const seatCode = `${row}${String.fromCharCode(64 + col)}`;
      return { code: seatCode, occupied: reservedSeats.has(seatCode) };
    });

    return seatArray;
  }, [concert]);

  // Reset requested seats when the concert changes
  useEffect(() => {
    setSelectedSeats([]);
  }, [concert]);

  const handleSeatClick = (seat) => {
    if (mode === "edit" && !seat.occupied) {
      setSelectedSeats((prevSelectedSeats) => {
        const newSelectedSeats = prevSelectedSeats.includes(seat.code)
          ? prevSelectedSeats.filter((code) => code !== seat.code)
          : [...prevSelectedSeats, seat.code];
        return newSelectedSeats;
      });
    }
  };

  const handleCloseAlert = () => {
    setError(null);
  };

  const handleSubmit = async () => {
    const summaryMessage = (
      <>
        <b>RESERVATION SUMMARY:</b>
        <br />
        <b>Concert:</b> {concert.concert_name}
        <br />
        <b>Date:</b> {dayjs(concert.concert_date).format("dddd, MMMM D, YYYY")}
        <br />
        <b>Theater:</b> {concert.theater_name}
        <br />
        <b>Requested seats:</b> {selectedSeats.join(", ")}
      </>
    );

    setReservationSummary(summaryMessage); // Set the summary message
    setShowModal(true); // Show the modal
  };

  const handleConfirmReservation = async (event) => {
    try {
      setShowModal(false); // Hide the modal

      event.preventDefault();
      const result = await reserveWithSeats(concert.concert_id, selectedSeats);
      if (result.ok) {
        const reservation = {
          concert_id: concert.concert_id,
          concert_name: concert.concert_name,
          concert_date: dayjs(concert.concert_date).format("YYYY-MM-DD"),
          theater: concert.theater_name,
          reserved_seats: selectedSeats,
        };

        navigate("/reserved-area/confirmed", { state: { reservation } });
      } else if (result.status === 400) {
        const response = await result.json();
        if (!(response.message === "Seats already reserved")) {
          throw new Error(response.message);
        }
        // Reservation failed: in the meantime someone else reserved the seats
        setError(
          "Reservation failed: The requested seats are no longer available. Please try again. The seats that became occupied are highlighted for 5 seconds."
        );
        handleReservationFailure();
      } else {
        throw new Error(
          `Server sent a response with the following error: ${result.statusText}`
        );
      }
    } catch (error) {
      setError("Manual reserve failed: " + error.message);
    }
  };

  const handleReservationFailure = async () => {
    try {
      const oldOccupiedSeats = concert.reserved_seats;
      const response = await getConcertById(concert.concert_id);

      if (!response.ok) {
        throw new Error("Failed to fetch concert details.");
      }

      const concertWithUpdatedSeats = await response.json();
      setConcert(concertWithUpdatedSeats);

      const updatedOccupiedSeats = concertWithUpdatedSeats.reserved_seats;

      const newOccupiedSeats = updatedOccupiedSeats.filter(
        (seat) => !oldOccupiedSeats.includes(seat)
      );

      setHighlightedSeats(newOccupiedSeats);

      setTimeout(() => {
        setHighlightedSeats([]);
        setSelectedSeats([]);
        setConcert(concertWithUpdatedSeats);
      }, 5000);
    } catch (error) {
      setError(
        "An error occurred while handling Reservation failure:" + error.message
      );
    }
  };

  const renderBadge = useCallback(
    (text, bg) => (
      <Badge bg={bg} className="me-2">
        {text}
      </Badge>
    ),
    []
  );

  return (
    <Container>
      {concert ? (
        <>
          {mode === "view" && <h5 className="my-4">Seat Viewer</h5>}
          {mode === "edit" && (
            <>
              <h5 className="my-4">Manual Seats Reservation System</h5>
              <p>
                To proceed with the reservation, please select the desired seats
                from those available.
              </p>
            </>
          )}
          <p>
            {renderBadge("Occupied", "danger")}
            {renderBadge("Available", "success")}
            {mode === "edit" && renderBadge("Requested", "warning")}
            {mode === "edit" &&
              highlightedSeats.length > 0 &&
              renderBadge("Became Occupied", "info")}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${concert.theater_cols}, 1fr)`,
            }}
          >
            {seats.map((seat) => (
              <div
                key={seat.code}
                onClick={() => handleSeatClick(seat)}
                style={{
                  border: "1px solid #ccc",
                  margin: "2px",
                  padding: "10px",
                  textAlign: "center",
                  backgroundColor: highlightedSeats.includes(seat.code)
                    ? "#0dcaf0" // Blue color for seats that became occupied
                    : seat.occupied
                    ? "#dc3545" // Red color for seats that are occupied
                    : selectedSeats.includes(seat.code)
                    ? "#ffc107" // Yellow color for seats that are selected
                    : "#198754", // Green color for seats that are available
                  color: "white",
                  borderRadius: "4px",
                  cursor:
                    mode === "edit" && !seat.occupied ? "pointer" : "default",
                }}
                aria-label={`Seat ${seat.code} ${
                  seat.occupied ? "occupied" : "available"
                }`}
              >
                {seat.code}
              </div>
            ))}
          </div>
          {mode === "edit" && (
            <Button
              variant="primary"
              className="mt-3"
              onClick={handleSubmit}
              disabled={!concert || selectedSeats.length === 0}
            >
              Reserve the requested seats (Manual Reservation)
            </Button>
          )}
          {error && (
            <Alert variant="danger" onClose={handleCloseAlert} dismissible>
              {error}
            </Alert>
          )}

          {/* Modal for reservation confirmation */}
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Reservation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>{reservationSummary}</p>
              <p>Do you want to confirm the reservation for these seats?</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmReservation}>
                Confirm
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      ) : (
        <p>Loading concert details...</p>
      )}
    </Container>
  );
};

export default SeatsManager;
