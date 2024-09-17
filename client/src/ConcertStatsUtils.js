export const calculateTotalSeats = (concert) => {
  if (!concert) return 0;
  return concert.theater_rows * concert.theater_cols;
};

export const calculateOccupiedSeats = (concert) => {
  return concert ? concert.reserved_seats.length : 0;
};

export const calculateAvailableSeats = (concert, selectedSeatsCount = 0) => {
  return concert
    ? calculateTotalSeats(concert) -
        concert.reserved_seats.length -
        selectedSeatsCount
    : 0;
};
