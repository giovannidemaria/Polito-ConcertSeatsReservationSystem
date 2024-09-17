import React, { useState } from "react";
import { Form, Button, Container, Row, Col, Alert } from "react-bootstrap";
import { login } from "../API.js";

function LoginForm({ setIsAuthenticated, setUser }) {
  const [username, setUsername] = useState(""); // State to store the username input
  const [password, setPassword] = useState(""); // State to store the password input
  const [error, setError] = useState(""); // State to store any error messages
  const [loading, setLoading] = useState(false); // State to manage loading state

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUser(user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Reset any previous errors

    try {
      const result = await login(username, password);

      if (result.ok) {
        const data = await result.json();
        handleLogin(data);
      } else if (result.status === 401) {
        throw new Error("Invalid username or password");
      } else {
        throw new Error(
          "An unexpected error occurred. Please try again later."
        );
      }
    } catch (error) {
      setError("Login error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center">Login</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group
              controlId="formBasicEmail"
              style={{ marginBottom: "1.5rem" }}
            >
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group
              controlId="formBasicPassword"
              style={{ marginBottom: "1.5rem" }}
            >
              {" "}
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginForm;
