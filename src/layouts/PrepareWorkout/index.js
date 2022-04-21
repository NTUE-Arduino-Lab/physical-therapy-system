import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

const PrepareWorkout = () => {
    const navigate = useNavigate();

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goMonitoring = () => {
        navigate(ROUTE_PATH.monitoring_workout);
    };

    return (
        <div className={styles.container}>
            <p>This is Prepare Workout</p>
            <button onClick={goDashboard}>go to dashboard</button>
            <button onClick={goMonitoring}>go to monitoring</button>
        </div>
    );
};

export default PrepareWorkout;
