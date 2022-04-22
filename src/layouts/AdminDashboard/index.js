import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

const AdminDashboard = () => {
    const navigate = useNavigate();
    // const { pathname } = useLocation();

    const goUserList = () => {
        navigate(ROUTE_PATH.user_list);
    };

    const goDifficulityList = () => {
        navigate(ROUTE_PATH.difficulty_list);
    };

    const goRecordList = () => {
        navigate(ROUTE_PATH.record_list);
    };

    const goPrepareWorkout = () => {
        navigate(ROUTE_PATH.prepare_workout);
    };

    return (
        <div className={styles.container}>
            <p>This is Admin Dashboard</p>
            <button onClick={goUserList}>User List</button>
            <button onClick={goRecordList}>Record List</button>
            <button onClick={goDifficulityList}>Difficulity List</button>
            <button onClick={goPrepareWorkout}>Prepare Workout</button>
        </div>
    );
};

export default AdminDashboard;
