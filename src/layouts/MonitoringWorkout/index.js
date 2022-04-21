import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { query, onSnapshot } from 'firebase/firestore';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { getRpmsWithPairdId } from '../../services/firebase';

const MonitoringWorkout = () => {
    const navigate = useNavigate();
    const [rpms, setRpms] = useState([]);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const rpmsRef = query(await getRpmsWithPairdId('2345'));

        if (rpmsRef == null) {
            alert('the pair id not correct');
            return;
        }

        onSnapshot(rpmsRef, (querySnapshot) => {
            const newRpms = [];
            querySnapshot.forEach((doc) => {
                newRpms.push(doc.data());
            });

            newRpms.sort((a, b) => a.time - b.time);

            setRpms(newRpms);
        });
    };

    const goFinishWorkout = () => {
        navigate(ROUTE_PATH.finsished_workout);
    };

    return (
        <div className={styles.container}>
            {rpms.map((e) => (
                <p key={e.time}>{e.rpm}</p>
            ))}
            <p>This is monitoring page</p>
            <button onClick={goFinishWorkout}>Finish workout</button>
        </div>
    );
};

export default MonitoringWorkout;
