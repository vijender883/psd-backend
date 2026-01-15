const axios = require("axios");

async function addSimulation() {
  try {
    const payload = {
      title: "Two Sum Practice",
      description: "A simulation to practice the classic Two Sum problem.",
      problemIds: ["TwoSum"], // Matches filename TwoSum.json
      mcqTests: [],
      scheduledStartTime: new Date().toISOString(),
      scheduledEndTime: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(), // 7 days from now
    };

    console.log("Sending payload:", payload);

    const response = await axios.post(
      "http://localhost:3001/api/simulations/add-simulation",
      payload
    );

    console.log("Success!");
    console.log("Simulation ID:", response.data.simulation._id);
    console.log("Response:", response.data);
  } catch (error) {
    if (error.response) {
      console.error(
        "Error Response:",
        error.response.status,
        error.response.data
      );
    } else if (error.code === "ECONNREFUSED") {
      console.error(
        "Error: Connection refused. Is the server running on port 3001?"
      );
    } else {
      console.error("Error:", error.message);
    }
  }
}

addSimulation();
