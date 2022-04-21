import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocs, query, onSnapshot } from 'firebase/firestore';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { usersRef } from '../../services/firebase';

// let unsubscribe;

const UserList = () => {
    const navigate = useNavigate();

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const querySnapshot = await getDocs(usersRef);
        querySnapshot.forEach((doc) => {
            console.log(`${doc.id} => ${doc.data()}`);
        });

        const q = query(usersRef);
        onSnapshot(q, (querySnapshot) => {
            const cities = [];
            querySnapshot.forEach((doc) => {
                cities.push(doc.data().name);
            });
            console.log('Current user', cities.join(', '));
        });
    };

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
