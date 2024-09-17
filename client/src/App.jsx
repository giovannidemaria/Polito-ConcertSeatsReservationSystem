import React, { useState, useEffect } from "react";
import Home from "./Home.jsx";
import ReservedArea from "./ReservedArea.jsx";
import ReservationCreatorPage from "./ReservationCreatorPage.jsx";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { Container, Navbar, Nav, Button, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { logout, checkSession } from "./API.js";
import ConfirmationPage from "./ConfirmationPage.jsx";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State to track if the user is authenticated
  const [user, setUser] = useState(null); // State to store the user information
  const [error, setError] = useState(null); // State to manage error state

  // Handles logout
  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.ok) {
        setIsAuthenticated(false); // Reset authentication state on logout
        setUser(null); // Clear user information on logout
      } else {
        throw new Error(
          "Server sent a response with the following error: " +
            result.statusText
        );
      }
    } catch (err) {
      setError("handleLogout error: " + err.message);
    }
  };

  const handleCloseAlert = () => {
    setError(null);
  };

  // check is the session is initialized
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await checkSession();
        if (response.ok) {
          const user = await response.json();
          setIsAuthenticated(true);
          setUser(user);
        } else if (response.status !== 401) {
          throw new Error("Failed to check session");
        }
      } catch (error) {
        setError("CheckSession error: " + error.message);
      }
    };

    initializeSession();
  }, [setIsAuthenticated, setUser]);

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">
            Concert Seats Reservation System
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                Home Page
              </Nav.Link>
              <Nav.Link as={Link} to="/reserved-area">
                Reserved Area
              </Nav.Link>
            </Nav>
            {isAuthenticated && user && (
              <Nav className="ms-auto align-items-center">
                <Navbar.Text className="me-3">
                  Logged as: <b>{user.username}</b>
                </Navbar.Text>
                <Button variant="outline-light" onClick={handleLogout}>
                  Logout
                </Button>
              </Nav>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {error && (
        <Alert variant="danger" onClose={handleCloseAlert} dismissible>
          {error}
        </Alert>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/reserved-area"
          element={
            <ReservedArea
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              user={user}
              setUser={setUser}
            />
          }
        />
        <Route
          path="/reserved-area/reserve"
          element={
            <ReservationCreatorPage
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              user={user}
              setUser={setUser}
            />
          }
        />
        <Route path="/reserved-area/confirmed" element={<ConfirmationPage />} />
      </Routes>

      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <Container>
          <p className="mb-0">
            Giovanni de Maria – Mat. 331031 – A.Y. 2023/2024 – Concert Seats –
            Web Applications – Exam #3
          </p>
        </Container>
      </footer>
    </Router>
  );
}
export default App;
