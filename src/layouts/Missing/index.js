import React from 'react';

import Header from '../../components/Header';
import styles from './styles.module.scss';

const Missing = () => {
    return (
        <div className={styles.container}>
            <Header />
            <h1>!NOT FOUND!</h1>
            <p>Sorry, the page you visited is not exist</p>
        </div>
    );
};

export default Missing;
