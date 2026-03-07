import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Schedule.css';

const Schedule = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);
  
  const navigate = useNavigate();

  const SPORTS_CATEGORIES = [
    { name: 'Basketball', icon: '🏀', color: '#FFD93D' },
    { name: 'Cricket', icon: '🏏', color: '#A8E6CF' },
    { name: 'Volleyball', icon: '🏐', color: '#FF6B6B' },
    { name: 'Kabaddi', icon: '🏃‍♂️', color: '#6C5CE7' },
    { name: 'Throwball', icon: '🏐', color: '#4ECDC4' },
    { name: '100m Sprint', icon: '🏃', color: '#FF8A5C' },
    { name: '200m Sprint', icon: '🏃', color: '#FF6A00' },
    { name: 'Relay Race', icon: '🏃‍♀️', color: '#FFD93D' },
    { name: 'Badminton', icon: '🏸', color: '#A8E6CF' },
    { name: 'Carrom', icon: '🎲', color: '#4ECDC4' },
    { name: 'Chess', icon: '♟️', color: '#6C5CE7' }
  ];

  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    
    // Listen for schedules
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedMatches = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => {
          // Reliable 24h sorting
          const timeA = a.time || '99:99';
          const timeB = b.time || '99:99';
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

  const formatTime = (timeStr) => {
    if (!timeStr) return 'TBD';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${period}`;
  };

  const filteredMatches = selectedSport 
    ? matches.filter(m => m.sport && m.sport.toLowerCase() === selectedSport.toLowerCase())
    : [];

  return (
    <div className="container page-content">
      <div className="schedule-header">
        <h1 className="heading-section">
          Match <span className="text-gradient-blue">Schedule</span>
        </h1>
        <p className="text-secondary text-center">
          {selectedSport ? `Fixtures for ${selectedSport}` : 'Select a sport to view fixtures'}
        </p>
      </div>

      {loading ? (
        <div className="loader">Loading Schedule...</div>
      ) : !selectedSport ? (
        <div className="sports-categories-grid">
          {SPORTS_CATEGORIES.map((sport) => (
            <div 
              key={sport.name} 
              className="sport-card glass-panel"
              onClick={() => setSelectedSport(sport.name)}
              style={{ '--sport-color': sport.color }}
            >
              <div className="sport-icon">{sport.icon}</div>
              <h3 className="sport-name">{sport.name}</h3>
              <div className="sport-card-glow"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <button className="btn-back" onClick={() => setSelectedSport(null)}>
            ← Back to Sports
          </button>
          
          {filteredMatches.length === 0 ? (
            <div className="no-data glass-panel text-center">
              <h3>No {selectedSport} Fixtures Announced Yet</h3>
              <p className="text-secondary mt-2">Check back later or choose another sport.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="sports-table glass-panel">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>MATCH</th>
                    <th>Venue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match) => (
                    <tr 
                      key={match.id} 
                      className="table-row clickable-row"
                      onClick={() => navigate(`/fixtures?sport=${match.sport}`)}
                      title="Click to view match live"
                    >
                      <td className="font-heading highlight">{formatTime(match.time)}</td>
                      <td className="team-col font-heading">
                        {(match.teamA || 'Team A')} <span className="vs-text">Vs</span> {(match.teamB || 'Team B')}
                      </td>
                      <td className="text-secondary">{match.venue || 'TBD'}</td>
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
        </>
      )}
    </div>
  );
};

export default Schedule;
