import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATH } from '../../constants/';

import styles from './styles.module.scss';

const Header = () => {
    return (
        <div className={styles.container}>
            <Link to={ROUTE_PATH.admin_dashbaord}>Dashboard</Link>
        </div>
    );
};

export default Header;
