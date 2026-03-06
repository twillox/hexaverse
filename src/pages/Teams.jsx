import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import './Teams.css';

const teamsData = [
  { id: 'VAJRA', name: 'VAJRA', captain: 'Kotte Ashwath', color: '#FFD700', description: 'The thunderbolt. Indestructible and unyielding force.' },
  { id: 'SAMUDRA', name: 'SAMUDRA', captain: 'Sarthak Nashine', color: '#00BFFF', description: 'The vast ocean. Deep, relentless, and overpowering.' },
  { id: 'VAYU', name: 'VAYU', captain: 'Spandan Sahu', color: '#E0FFFF', description: 'The wind. Swift, unseen, and omnipresent.' },
  { id: 'AGNI', name: 'AGNI', captain: 'M.Rohitha Reddy', color: '#FF4500', description: 'The fire. Fierce, consuming, and radiant.' }
];

const Teams = () => {
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
              <Shield size={64} className="team-icon" />
              <div className="icon-glow"></div>
            </div>
            <h2 className="team-name">{team.name}</h2>
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
