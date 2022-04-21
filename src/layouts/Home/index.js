import React from 'react';

import Header from '../../components/Header';

import styles from './styles.module.scss';

const Home = () => {
    return (
        <div className={styles.container}>
            <Header />
            This is Home page
        </div>
    );
};

export default Home;
