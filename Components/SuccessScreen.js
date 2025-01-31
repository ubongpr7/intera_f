'use client';

import React from 'react';
import PropTypes from 'prop-types';
import styles from './SuccessScreen.module.css';

const SuccessScreen = ({ onGoBack }) => {
  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2 className={styles.heading}>Success!</h2>

        <p>Your ad campaign has been successfully created.</p>
        <video 
          src="/assets/WhatsApp%20Video%202024-09-09%20at%203.03.28%20PM.mp4" 
          className={styles.successVideo} 
          autoPlay 
          loop 
          muted 
          playsInline
        />
        <p>Your ads are automatically paused.</p>
        <p>When you're ready, just turn them on from the ads section in your Ads manager.</p>
        
        <button className={styles.successGoBackButton} onClick={onGoBack}>Go Back</button>
      </div>
    </div>
  );
};

SuccessScreen.propTypes = {
  onGoBack: PropTypes.func.isRequired,
};

export default SuccessScreen;
