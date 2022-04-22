import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocs } from 'firebase/firestore';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { recordsRef } from '../../services/firebase';

const RecordList = () => {
    const navigate = useNavigate();

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const querySnapshot = await getDocs(recordsRef);
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${doc.data()}`);
        });
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    return (
        <div className={styles.container}>
            <p>This is record list</p>
            <button onClick={goDashboard}>go to dashboard</button>
        </div>
    );
};

export default RecordList;
