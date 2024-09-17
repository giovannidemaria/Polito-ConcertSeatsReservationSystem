import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import { getAuthToken, getDiscount } from "./API";
import dayjs from "dayjs";

const ConfirmationPage = () => {
  const navigate = useNavigate(); // Hook to navigate between routes
  const location = useLocation(); // Hook to access the current location and its state object
  const { reservation } = location.state || {}; // Destructure 'reservation' from location state, defaulting to an empty object if state is undefined

  const [discount, setDiscount] = useState(null); // State to store the discount value, initially set to null
  const [loading, setLoading] = useState(true); // State to track the loading status, initially set to true while fetching the discount
  const [error, setError] = useState(null); // State to store any error message that occurs during the discount fetch, initially null

  const handleTurnBackRedirect = () => {
    navigate("/reserved-area");
  };

  // when the component mounts, fetch the discount
  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const response = await getAuthToken();
        if (!response.ok) {
          throw new Error("Failed to fetch auth token.");
        }
        const token = await response.json();
        if (!token) {
          throw new Error("Authentication token not found");
        }
        const response2 = await getDiscount(token, reservation.reserved_seats);
        if (!response2.ok) {
          throw new Error("Failed to fetch discount");
        }
        const info = await response2.json();
        setDiscount(info.discount);
      } catch (err) {
        setError("fetchDiscount error: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscount();
  }, [reservation?.seats]);

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ height: "70vh" }}
    >
      <Row>
        <Col>
          <Card className="text-center p-4 shadow">
            <Card.Body>
              <FaCheckCircle size={100} color="green" className="mb-4" />
              <Card.Title>Reservation Confirmed Successfully</Card.Title>
              <Card.Text>
                <b>Concert:</b> {reservation?.concert_name}
              </Card.Text>
              <Card.Text>
                <b>Date:</b>{" "}
                {dayjs(reservation?.concert_date).format("YYYY-MM-DD")}{" "}
              </Card.Text>
              <Card.Text>
                <b>Theater:</b> {reservation?.theater}
              </Card.Text>
              <Card.Text>
                <b>Seats:</b> {reservation?.reserved_seats.join(", ")}
              </Card.Text>
              {loading ? (
                <Card.Text className="mt-4">Loading discount...</Card.Text>
              ) : error ? (
                <Alert variant="danger" className="mt-4">
                  {error}
                </Alert>
              ) : (
                <Card.Text className="mt-4">
                  <b>Special Offer:</b> Get a {discount}% discount on your next
                  concert!
                </Card.Text>
              )}
              <Button
                variant="primary"
                onClick={handleTurnBackRedirect}
                className="me-2"
              >
                <FaArrowLeft className="me-2" />
                Return to Reserved Area Main Page{" "}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ConfirmationPage;
