import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';

const StopWatch = ({ start, initialValue }) => {
    const [time, setTime] = useState(initialValue);
    const [miliDisplay, setMiliDisplay] = useState(0);

    useEffect(() => {
        let interval = null;
        let displayInterval = null;

        if (start) {
            interval = setInterval(() => {
                setTime((time) => time + 10);
            }, 10);

            displayInterval = setInterval(() => {
                setMiliDisplay((miliDisplay) => {
                    if (miliDisplay + 10 > 1000) return 0;
                    else return miliDisplay + 10;
                });
            }, 10);
        } else {
            clearInterval(interval);
            clearInterval(displayInterval);
        }

        return () => {
            clearInterval(interval);
            clearInterval(displayInterval);
        };
    }, [start]);

    return (
        <div className={styles.container}>
            <span className="digits">
                {('0' + Math.floor(time / 3600000)).slice(-2)}:
            </span>
            <span className="digits">
                {('0' + Math.floor((time / 60000) % 60)).slice(-2)}:
            </span>
            <span className="digits">
                {('0' + Math.floor((time / 1000) % 60)).slice(-2)}.
            </span>
            <span className="digits mili-sec">
                {('0' + ((miliDisplay / 10) % 100)).slice(-2)}
            </span>
        </div>
    );
};

StopWatch.propTypes = {
    start: PropTypes.bool,
    initialValue: PropTypes.number,
};

export default StopWatch;
