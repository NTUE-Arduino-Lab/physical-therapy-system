import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

const MonitoringWorkout = () => {
    const navigate = useNavigate();
    // const { pathname } = useLocation();

    const goFinishWorkout = () => {
        navigate(ROUTE_PATH.finsished_workout);
    };

    return (
        <div className={styles.container}>
            <p>This is monitoring page</p>
            <button onClick={goFinishWorkout}>Finish workout</button>
        </div>
    );
};

export default MonitoringWorkout;
