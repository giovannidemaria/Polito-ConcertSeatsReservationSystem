import React from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./components/LoginForm.jsx";
import { Container, Row, Col, Button } from "react-bootstrap";
import ReservationTable from "./components/ReservationTable.jsx";
import { FaPlus } from "react-icons/fa";

function ReservedArea({ isAuthenticated, setIsAuthenticated, user, setUser }) {
  return (
    <Container>
      {!isAuthenticated ? (
        <LoginForm setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
      ) : (
        <AuthenticatedBehaviour user={user} />
      )}
    </Container>
  );
}

function AuthenticatedBehaviour({ user }) {
  const navigate = useNavigate(); // Hook to navigate between routes

  const handleReserve = () => {
    navigate("/reserved-area/reserve");
  };

  return (
    <>
      <Row className="mb-4 justify-content-between align-items-center">
        <Col>
          <h2>Welcome, {user.displayed_name}!</h2>
          <p>
            You are logged in as <b>{user.username}</b>.
          </p>
          <p>
            Here, you can manage your concert reservations: view, delete, or add
            new ones with ease.{" "}
          </p>
          <p>
            Below, you'll find a table displaying your existing reservations,
            each with an option to delete, if any reservations exist.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Button variant="primary" onClick={handleReserve} className="me-2">
            <FaPlus className="me-2" />
            Reserve seats
          </Button>
        </Col>
      </Row>

      <ReservationTable />
    </>
  );
}

export default ReservedArea;
