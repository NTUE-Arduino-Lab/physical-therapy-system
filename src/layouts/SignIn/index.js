import React from 'react';
import { useNavigate } from 'react-router-dom';

// import Header from '../../components/Header';
import styles from './styles.module.scss';
import { ROUTE_PATH } from '../../constants';

const SignIn = () => {
    const navigate = useNavigate();

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord, { replace: true });
    };

    return (
        <div className={styles.container}>
            {/* <Header /> */}
            <p>Sign In Page</p>
            <button onClick={goDashboard}>Navigate To Admin Dashboard</button>
        </div>
    );
};

export default SignIn;
