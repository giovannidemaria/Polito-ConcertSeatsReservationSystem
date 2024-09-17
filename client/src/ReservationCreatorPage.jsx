import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  ButtonGroup,
  Alert,
} from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import ConcertSelector from "./components/ConcertSelector";
import { getReservations } from "./API.js";
import SeatsManager from "./components/SeatsManager";
import AutomaticSeatsReserver from "./components/AutomaticSeatsReserver";
import SeatsStats from "./components/SeatsStats";

function ReservationCreatorPage({
  isAuthenticated,
  setIsAuthenticated,
  setUser,
}) {
  const navigate = useNavigate(); // Hook to navigate between routes
  const [selectedConcert, setSelectedConcert] = useState(null); // State to store the selected concert
  const [isAlreadyReserved, setIsAlreadyReserved] = useState(null); // State to check if the concert is already reserved
  const [selectedSeatsCount, setSelectedSeatsCount] = useState(0); // State to store the count of requested seats (first mode)
  const [selectionMode, setSelectionMode] = useState("manual"); // New state to track user's seat selection mode (manual/automatic)
  const [error, setError] = useState(null); // State to manage error state

  // Check reservations if there is a selected concert and if there is a reservation on the selected concert set IsAlreadyReserved flag.
  useEffect(() => {
    const checkReservations = async () => {
      if (selectedConcert) {
        try {
          const response = await getReservations();
          if (!response.ok) {
            throw new Error("Failed to check reservations");
          }
          const reservations = await response.json();

          const alreadyReserved = reservations.some(
            (reservation) =>
              reservation.concert_id === selectedConcert.concert_id
          );
          setIsAlreadyReserved(alreadyReserved);
        } catch (error) {
          setError("checkReservation error: " + error.message);
        }
      }
    };
    checkReservations();
  }, [selectedConcert]);

  // check if the session is initialized
  useEffect(() => {
    // If not authenticated, redirect to /reserved-area
    if (!isAuthenticated) {
      navigate("/reserved-area");
    }
  }, [isAuthenticated, setIsAuthenticated, setUser, navigate]);

  // Reset SelectedSeatsCount and SelectionMode when the selected concert changes
  useEffect(() => {
    if (selectedConcert) {
      setSelectedSeatsCount(0);
      setSelectionMode("manual");
    }
  }, [selectedConcert?.concert_id]);

  const handleSeatSelectionChange = (seatCount) => {
    setSelectedSeatsCount(seatCount);
  };

  const handleTurnBackRedirect = () => {
    navigate("/reserved-area");
  };

  const handleCloseAlert = () => {
    setError(null);
  };

  return (
    <>
      <Container>
        <Row className="mb-4">
          {error && (
            <Alert variant="danger" onClose={handleCloseAlert} dismissible>
              {error}
            </Alert>
          )}
          <Col>
            <Button
              variant="primary"
              onClick={handleTurnBackRedirect}
              className="me-2"
            >
              <FaArrowLeft className="me-2" />
              Return to Reserved Area Main Page{" "}
            </Button>
          </Col>
        </Row>
        <h2 className="my-4">
          Choose a concert to see more details & to reserve
        </h2>
        <ConcertSelector
          selectedConcert={selectedConcert}
          setSelectedConcert={setSelectedConcert}
          isAlreadyReserved={isAlreadyReserved}
          setSelectedSeatsCount={setSelectedSeatsCount}
        />

        {selectedConcert && !isAlreadyReserved && (
          <>
            <h4 className="mt-4">Select Reservation Mode:</h4>
            <ButtonGroup className="mt-3">
              <Button
                variant="outline-primary"
                onClick={() => setSelectionMode("manual")}
                active={selectionMode === "manual"}
              >
                Manual Mode
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => setSelectionMode("automatic")}
                active={selectionMode === "automatic"}
              >
                Automatic Mode
              </Button>
            </ButtonGroup>
            <SeatsStats
              concert={selectedConcert}
              selectedSeatsCount={selectedSeatsCount}
            />
            {selectionMode === "manual" && (
              <SeatsManager
                concert={selectedConcert}
                setConcert={setSelectedConcert}
                mode={"edit"}
                onSeatSelectionChange={handleSeatSelectionChange}
              />
            )}

            {selectionMode === "automatic" && (
              <AutomaticSeatsReserver
                concert={selectedConcert}
                setConcert={setSelectedConcert}
                onSeatSelectionChange={handleSeatSelectionChange}
                selectedSeatsCount={selectedSeatsCount}
              />
            )}
          </>
        )}
      </Container>
    </>
  );
}

export default ReservationCreatorPage;
