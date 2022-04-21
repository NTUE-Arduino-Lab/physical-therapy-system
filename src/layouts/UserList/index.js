import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

const UserList = () => {
    const navigate = useNavigate();

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    return (
        <div className={styles.container}>
            <p>This is user list</p>
            <button onClick={goDashboard}>go to dashboard</button>
        </div>
    );
};

export default UserList;
