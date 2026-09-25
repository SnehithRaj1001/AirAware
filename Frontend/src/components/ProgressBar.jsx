import React from 'react';

const ProgressBar = ({ progress, status, message }) => {
  return (
    <div className="progress-container" style={{
      width: '100%',
      maxWidth: '400px',
      margin: '20px auto',
      textAlign: 'center'
    }}>
      <div className="progress-label" style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--text-main)'
      }}>
        <span>{status === 'training' ? 'Training AI Model...' : message}</span>
        <span>{progress}%</span>
      </div>
      <div className="progress-bar-bg" style={{
        width: '100%',
        height: '10px',
        background: 'var(--border)',
        borderRadius: '5px',
        overflow: 'hidden'
      }}>
        <div className="progress-bar-fill" style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--accent) 0%, #3b82f6 100%)',
          borderRadius: '5px',
          transition: 'width 0.3s ease-out'
        }}></div>
      </div>
      <p className="progress-hint" style={{
        marginTop: '10px',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        {status === 'training' ? 'This might take a few moments depending on the data size.' : 'Finalizing predictions...'}
      </p>
    </div>
  );
};

export default ProgressBar;
