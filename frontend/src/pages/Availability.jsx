import { useEffect, useState } from "react";
import api from "../api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function Availability() {
  const studentID = localStorage.getItem("studentID");

  const [availability, setAvailability] = useState([]);
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAvailability = async () => {
    try {
      const response = await api.get(`/availability/${studentID}`);
      setAvailability(response.data);
    } catch (error) {
      alert(error.response?.data?.message || "Could not load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentID) loadAvailability();
  }, [studentID]);

  const addAvailability = async () => {
    if (!startTime || !endTime) {
      alert("Please select start and end time");
      return;
    }

    if (startTime >= endTime) {
      alert("End time must be after start time");
      return;
    }

    try {
      const response = await api.post("/availability", {
        studentID: Number(studentID),
        dayOfWeek: day,
        startTime,
        endTime,
      });

      alert(response.data.message);
      setStartTime("");
      setEndTime("");
      loadAvailability();
    } catch (error) {
      alert(error.response?.data?.message || "Could not save availability");
    }
  };

  if (loading) return <h2>Loading availability...</h2>;

  return (
    <div>
      <h1>My Availability</h1>
      <p>Tell StudySync when you are free to study.</p>

      <label>Day</label><br />
      <select value={day} onChange={(e) => setDay(e.target.value)}>
        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <br /><br />

      <label>Start Time</label><br />
      <input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
      <br /><br />

      <label>End Time</label><br />
      <input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
      />
      <br /><br />

      <button onClick={addAvailability}>Add Availability</button>

      <h2>My Available Times</h2>

      {availability.length === 0 ? (
        <p>No availability added yet.</p>
      ) : (
        availability.map((item) => (
          <div key={item.AvailabilityID}>
            <strong>{item.DayOfWeek}</strong>
            {" : "}
            {String(item.StartTime).slice(0, 5)}
            {" - "}
            {String(item.EndTime).slice(0, 5)}
          </div>
        ))
      )}
    </div>
  );
}

export default Availability;