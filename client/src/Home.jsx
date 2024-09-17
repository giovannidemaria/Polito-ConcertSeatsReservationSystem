import React, { useState } from "react";
import { Container } from "react-bootstrap";
import ConcertSelector from "./components/ConcertSelector.jsx";
import SeatsManager from "./components/SeatsManager.jsx";
import SeatsStats from "./components/SeatsStats.jsx";

const Home = () => {
  const [selectedConcert, setSelectedConcert] = useState(null); // State to store the selected concert

  return (
    <>
      <Container>
        <h2 className="my-4">Choose a concert to see more details.</h2>

        <ConcertSelector
          selectedConcert={selectedConcert}
          setSelectedConcert={setSelectedConcert}
        />

        {selectedConcert && (
          <>
            <SeatsStats concert={selectedConcert} />
            <SeatsManager concert={selectedConcert} mode={"view"} />
          </>
        )}
      </Container>
    </>
  );
};

export default Home;
