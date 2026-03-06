import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebase';
import { Crown } from 'lucide-react';
import './Leaderboard.css';

const teamColors = {
  VAJRA: '#FFD700',
  SAMUDRA: '#00BFFF',
  VAYU: '#E0FFFF',
  AGNI: '#FF4500'
};

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const leaderboardRef = ref(db, 'leaderboard');
    
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        let formattedData = Object.keys(data).map(key => ({
          teamName: key,
          gold: data[key]?.gold || 0,
          silver: data[key]?.silver || 0,
          wins: data[key]?.wins || 0,
          losses: data[key]?.losses || 0,
          points: data[key]?.points || 0,
        }));
        
        // Sort by points descending
        formattedData.sort((a, b) => b.points - a.points);
        setLeaderboardData(formattedData);
      } else {
        // Fallback or empty state
        const defaultTeams = ['VAJRA', 'SAMUDRA', 'VAYU', 'AGNI'];
        setLeaderboardData(defaultTeams.map(t => ({
          teamName: t, gold: 0, silver: 0, points: 0
        })));
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase error", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container page-content">
      <div className="leaderboard-header text-center">
        <h1 className="heading-section">
          Tournament <span className="text-gradient-blue">Standings</span>
        </h1>
        <p className="text-secondary">Track the top-performing teams in Hexaverse 2.0</p>
      </div>

      {loading ? (
        <div className="loader">Loading Standings...</div>
      ) : (
        <div className="leaderboard-container glass-panel">
          <div className="leaderboard-row header-row">
            <div className="col-rank">#</div>
            <div className="col-team">Team</div>
            <div className="col-stat">
              <div className="header-icon">🥇</div>
              <div className="header-label">Gold</div>
            </div>
            <div className="col-stat">
              <div className="header-icon">🥈</div>
              <div className="header-label">Silver</div>
            </div>
            <div className="col-stat highlight-stat">
              <div className="header-icon">🔥</div>
              <div className="header-label">PTS</div>
            </div>
          </div>
          
          <div className="leaderboard-body">
            {leaderboardData.map((team, index) => {
              const isTop = index === 0;
              const teamColor = teamColors[team.teamName] || '#00BFFF';
              
              return (
                <div 
                  key={team.teamName} 
                  className={`leaderboard-row ${isTop ? 'top-team' : ''}`}
                  style={{ '--border-glow': teamColor }}
                >
                  <div className="col-rank">
                    {isTop ? <Crown size={24} color="#FFD700" className="pulse-icon" /> : index + 1}
                  </div>
                  <div className="col-team team-name-display" style={{ color: teamColor }}>
                    {team.teamName}
                  </div>
                  <div className="col-stat" style={{ color: '#FFD700' }}>{team.gold}</div>
                  <div className="col-stat" style={{ color: '#C0C0C0' }}>{team.silver}</div>
                  <div className="col-stat highlight-stat points-display">{team.points}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
