import React, { useState, useEffect } from "react";
import { ListGroup, Alert } from "react-bootstrap";
import { getConcerts } from "../API.js";
import dayjs from "dayjs";

const ConcertSelector = ({
  selectedConcert,
  setSelectedConcert,
  isAlreadyReserved = null,
  setSelectedSeatsCount = () => {},
}) => {
  const [concerts, setConcerts] = useState([]); // State to store concerts fetched from the API
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [error, setError] = useState(null); // State to manage error state

  // Fetch concerts when the component mounts
  useEffect(() => {
    const loadConcerts = async () => {
      try {
        const response = await getConcerts();
        if (response.ok) {
          const fetchedConcerts = await response.json();
          setConcerts(fetchedConcerts);
        } else {
          throw new Error("Failed to load concerts.");
        }
      } catch (err) {
        setError("loadConcerts failed: " + err.message);
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    loadConcerts();
  }, []);

  const handleSelect = (concert) => {
    setSelectedConcert(concert);
    setSelectedSeatsCount(0);
  };

  if (loading) {
    return <p>Loading concerts...</p>; // Display loading message while data is being fetched
  }

  if (error) {
    return <p>{error}</p>; // Display error message if data fetching fails
  }

  return (
    <>
      <ListGroup>
        {concerts.map((concert) => (
          <ListGroup.Item
            key={concert.concert_id}
            onClick={() => handleSelect(concert)}
            action
            variant={
              selectedConcert &&
              selectedConcert.concert_id === concert.concert_id
                ? "primary"
                : ""
            }
          >
            {concert.concert_name} - {concert.theater_name} -{" "}
            {dayjs(concert.concert_date).format("YYYY-MM-DD")}{" "}
          </ListGroup.Item>
        ))}
      </ListGroup>

      {isAlreadyReserved && (
        <Alert variant="warning" className="mt-3">
          <b>Reservation Notice:</b> This concert has already been reserved. To
          make changes to your reservation, please delete the existing
          reservation first.
        </Alert>
      )}
    </>
  );
};

export default ConcertSelector;
