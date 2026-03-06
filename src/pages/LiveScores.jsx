import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebase';
import { Activity } from 'lucide-react';
import './LiveScores.css';

const LiveScores = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    
    // Setup real-time listener
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedMatches = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMatches(formattedMatches);
      } else {
        setMatches([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container page-content">
      <div className="live-header">
        <h1 className="heading-section">
          Live <span className="text-gradient-blue">Matches</span>
        </h1>
        <div className="live-indicator-badge">
          <Activity size={24} className="pulse-icon" />
          <span>Real-Time Command Center</span>
        </div>
      </div>

      {loading ? (
        <div className="loader">Loading Matches...</div>
      ) : matches.length === 0 ? (
        <div className="no-data">
          <h3>No Match Data Available</h3>
          <p className="text-secondary">Schedules will be updated via the Admin panel.</p>
        </div>
      ) : (
        <div className="scoreboard-grid">
          {matches.map((match) => (
            <div 
              key={match.id} 
              className={`match-card glass-panel ${match.status === 'LIVE' ? 'is-live' : ''}`}
            >
              <div className="match-header">
                <span className="sport-tag">{match.sport}</span>
                {match.status === 'LIVE' ? (
                  <span className="live-indicator">
                    <span className="live-dot"></span> LIVE
                  </span>
                ) : (
                  <span className="finished-indicator">FINISHED</span>
                )}
              </div>
              
              <div className="match-teams-score">
                <div className="team">
                  <span className="team-name">{match.teamA}</span>
                </div>
                
                <div className="score-display">
                  <span className={`score-number ${match.status === 'LIVE' ? 'live-score-text' : ''}`}>
                    {match.scoreA}
                  </span>
                  <span className="score-divider">-</span>
                  <span className={`score-number ${match.status === 'LIVE' ? 'live-score-text' : ''}`}>
                    {match.scoreB}
                  </span>
                </div>

                <div className="team text-right">
                  <span className="team-name">{match.teamB}</span>
                </div>
              </div>

              <div className="match-footer text-secondary">
                <span>{match.time}</span>
                <span>{match.venue}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveScores;
