import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const Timer = ({ start }) => {
    const [time, setTime] = useState(0);

    useEffect(() => {
        let interval = null;

        if (start) {
            interval = setInterval(() => {
                setTime((time) => time + 10);
            }, 10);
        } else {
            clearInterval(interval);
        }

        return () => {
            clearInterval(interval);
        };
    }, [start]);

    return (
        <div className={styles.container}>
            <span className="digits">
                {('0' + Math.floor((time / 60000) % 60)).slice(-2)}:
            </span>
            <span className="digits">
                {('0' + Math.floor((time / 1000) % 60)).slice(-2)}.
            </span>
            <span className="digits mili-sec">
                {('0' + ((time / 10) % 100)).slice(-2)}
            </span>
        </div>
    );
};

Timer.propTypes = {
    start: PropTypes.bool,
};

export default Timer;
