import React from "react";
import { Card } from "react-bootstrap";
import dayjs from "dayjs";
import {
  calculateTotalSeats,
  calculateOccupiedSeats,
  calculateAvailableSeats,
} from "../ConcertStatsUtils.js";

const SeatsStats = ({ concert, selectedSeatsCount = 0 }) => {
  return (
    <>
      {concert && (
        <Card className="mt-4">
          <Card.Body>
            <Card.Title>You selected the following concert:</Card.Title>
            <Card.Text>
              <b>{concert.concert_name}</b> on{" "}
              {dayjs(concert.concert_date).format("dddd, MMMM D, YYYY")} at{" "}
              {concert.theater_name}{" "}
              {concert.theater_size !== null && (
                <span>({concert.theater_size} size theater)</span>
              )}
            </Card.Text>

            <Card.Text>
              <b>Seats stats:</b>
              <br />
              Total seats: {calculateTotalSeats(concert)}
              <br />
              Occupied seats: {calculateOccupiedSeats(concert)}
              <br />
              Requested seats: {selectedSeatsCount}
              <br />
              Available seats:{" "}
              {calculateAvailableSeats(concert, selectedSeatsCount)}
            </Card.Text>
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default SeatsStats;
