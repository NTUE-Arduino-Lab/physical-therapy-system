import React from 'react';

import Header from '../../components/Header';
import styles from './styles.module.scss';

const Unauthorized = () => {
    return (
        <div className={styles.container}>
            <Header />
            <p>Sorry, you are not authorized to view this page</p>
        </div>
    );
};

export default Unauthorized;
