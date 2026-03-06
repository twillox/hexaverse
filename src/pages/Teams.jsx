import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Trophy, Crosshair } from 'lucide-react';
import { db, ref, onValue } from '../firebase';
import './Teams.css';

const teamsData = [
  { id: 'VAJRA', name: 'VAJRA', captain: 'Kotte Ashwath', color: '#FFD700', logo: '/vajra.png', description: 'The thunderbolt. Indestructible and unyielding force.' },
  { id: 'SAMUDRA', name: 'SAMUDRA', captain: 'Sarthak Nashine', color: '#00BFFF', logo: '/samudra.png', description: 'The vast ocean. Deep, relentless, and overpowering.' },
  { id: 'VAYU', name: 'VAYU', captain: 'Spandan Sahu', color: '#E0FFFF', logo: '/vayu.png', description: 'The wind. Swift, unseen, and omnipresent.' },
  { id: 'AGNI', name: 'AGNI', captain: 'M.Rohitha Reddy', color: '#FF4500', logo: '/agni.png', description: 'The fire. Fierce, consuming, and radiant.' }
];

const Teams = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const leaderboardRef = ref(db, 'leaderboard');
    const unsub = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.val());
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="container page-content">
      <h1 className="heading-section">Participating <span className="text-gradient-blue">Teams</span></h1>
      <p className="text-secondary" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        Four houses. One champion. Choose your allegiance.
      </p>

      <div className="teams-grid">
        {teamsData.map((team) => (
          <Link 
            to={`/teams/${team.id}`}
            key={team.id} 
            className="team-card glass-panel"
            style={{ 
              '--team-color': team.color, 
              '--team-glow': `${team.color}80`,
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div className="team-icon-wrapper">
              <img src={team.logo} alt={`${team.name} Logo`} className="team-logo-img" />
              <div className="icon-glow"></div>
            </div>
            <h2 className="team-name">{team.name}</h2>
            
            <div className="team-stats-row">
              <div className="team-stat-item">
                <Trophy size={14} color={team.color} />
                <span>{stats[team.id]?.points || 0} pts</span>
              </div>
              <div className="team-stat-item">
                <Crosshair size={14} color="#39FF14" />
                <span>{stats[team.id]?.wins || 0}W</span>
              </div>
            </div>

            <div className="team-captain">
              <span className="captain-label">Captain:</span>
              <span className="captain-name">{team.captain}</span>
            </div>
            <p className="team-desc">{team.description}</p>
            <div className="team-border-bottom"></div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Teams;
