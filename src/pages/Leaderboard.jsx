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
        
        // Sort by Points DESC, Gold DESC, Silver DESC
        formattedData.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gold !== a.gold) return b.gold - a.gold;
          return b.silver - a.silver;
        });
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
            <div className="col-rank">Rank</div>
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
              <div className="header-label">Points</div>
            </div>
          </div>
          
          <div className="leaderboard-body">
            {leaderboardData.map((team, index) => {
              const teamColor = teamColors[team.teamName] || '#00BFFF';
              
              const getRankIcon = (rank) => {
                if (rank === 0) return <Crown size={24} color="#FFD700" className="pulse-icon" />;
                if (rank === 1) return <span style={{fontSize: '1.2rem'}}>🥈</span>;
                if (rank === 2) return <span style={{fontSize: '1.2rem'}}>🥉</span>;
                return rank + 1;
              };

              return (
                <div 
                  key={team.teamName} 
                  className={`leaderboard-row ${index === 0 ? 'top-team' : ''}`}
                  style={{ '--border-glow': teamColor }}
                >
                  <div className="col-rank">
                    {getRankIcon(index)}
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

      {/* POINTS SYSTEM SECTION */}
      <div className="leaderboard-header text-center" style={{ marginTop: '4rem' }}>
        <h2 className="heading-section">
          POINTS <span className="text-gradient-blue">SYSTEM</span>
        </h2>
      </div>

      <div className="leaderboard-container glass-panel" style={{ marginBottom: '4rem' }}>
        <div className="leaderboard-row header-row" style={{ gridTemplateColumns: 'minmax(120px, 2fr) minmax(120px, 2fr) 1fr 1fr' }}>
          <div className="col-team" style={{justifyContent: 'flex-start'}}>Category</div>
          <div className="col-team" style={{justifyContent: 'flex-start'}}>Type</div>
          <div className="col-stat" style={{ color: '#FFD700' }}>Gold Points</div>
          <div className="col-stat" style={{ color: '#C0C0C0' }}>Silver Points</div>
        </div>
        
        <div className="leaderboard-body">
          {[
            { cat: 'Outdoor', type: 'Team Sport', g: '8 pts', s: '5 pts' },
            { cat: 'Outdoor', type: 'Single Sport', g: '5 pts', s: '3 pts' },
            { cat: 'Indoor & Esports', type: 'Team Sport', g: '5 pts', s: '3 pts' },
            { cat: 'Indoor & Esports', type: 'Single Sport', g: '3 pts', s: '1 pt' }
          ].map((row, idx) => (
            <div key={idx} className="leaderboard-row" style={{ gridTemplateColumns: 'minmax(120px, 2fr) minmax(120px, 2fr) 1fr 1fr' }}>
              <div className="col-team text-secondary" style={{justifyContent: 'flex-start'}}>{row.cat}</div>
              <div className="col-team" style={{justifyContent: 'flex-start'}}>{row.type}</div>
              <div className="col-stat" style={{ color: '#FFD700' }}>{row.g}</div>
              <div className="col-stat" style={{ color: '#C0C0C0' }}>{row.s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
