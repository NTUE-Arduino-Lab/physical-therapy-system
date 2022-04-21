import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

const DifficulityList = () => {
    const navigate = useNavigate();

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    return (
        <div className={styles.container}>
            <p>Difficulity List Page</p>
            <button onClick={goDashboard}>go dashboard</button>
        </div>
    );
};

export default DifficulityList;
