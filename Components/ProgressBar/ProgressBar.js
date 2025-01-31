'use client';

import React from 'react';
import PropTypes from 'prop-types';
import styles from './ProgressBar.module.css';

const ProgressBar = ({ progress, step, stepVisible }) => {
  return (
    <div className={styles.container}>
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressBarFill} style={{ width: `${progress}%` }}>
            {`${progress.toFixed(2)}%`}
          </div>
        </div>
        {stepVisible && <div className={styles.progressBarStep}>{step}</div>}
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  step: PropTypes.string.isRequired,
  stepVisible: PropTypes.bool.isRequired,
};

export default ProgressBar;
