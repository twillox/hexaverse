import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebase';
import './Schedule.css';

const Schedule = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    
    // Listen for schedules
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Since schedule includes all matches, we can display them here. 
        // We could filter out 'FINISHED' matches if desired, but a schedule usually shows all.
        const formattedMatches = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => {
          // Robust sorting with fallbacks
          const timeA = a.time || '';
          const timeB = b.time || '';
          return timeA.localeCompare(timeB);
        });
        
        setMatches(formattedMatches);
      } else {
        setMatches([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container page-content">
      <div className="schedule-header">
        <h1 className="heading-section">
          Match <span className="text-gradient-blue">Schedule</span>
        </h1>
        <p className="text-secondary text-center">Upcoming and ongoing fixtures for Hexaverse 2.0</p>
      </div>

      {loading ? (
        <div className="loader">Loading Schedule...</div>
      ) : matches.length === 0 ? (
        <div className="no-data glass-panel text-center">
          <h3>No Fixtures Announced Yet</h3>
          <p className="text-secondary mt-2">Check back later or refresh the dashboard.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="sports-table glass-panel">
            <thead>
              <tr>
                <th>Time</th>
                <th>Sport</th>
                <th>Team A</th>
                <th>Team B</th>
                <th>Venue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id} className="table-row">
                  <td className="font-heading highlight">{match.time}</td>
                  <td>
                    <span className="sport-badge">{match.sport}</span>
                  </td>
                  <td className="team-col font-heading">{match.teamA}</td>
                  <td className="team-col font-heading">{match.teamB}</td>
                  <td className="text-secondary">{match.venue}</td>
                  <td>
                    {match.status === 'LIVE' ? (
                      <span className="live-indicator"><span className="live-dot"></span> LIVE</span>
                    ) : match.status === 'FINISHED' ? (
                      <span className="finished-indicator">FINISHED</span>
                    ) : (
                      <span className="upcoming-indicator">UPCOMING</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Schedule;
