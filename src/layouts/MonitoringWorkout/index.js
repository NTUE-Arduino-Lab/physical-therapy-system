import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onSnapshot, collection } from 'firebase/firestore';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';

import { recordsRef } from '../../services/firebase';

let unsubscribe = null;

const MonitoringWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();
    const [rpms, setRpms] = useState([]);

    useEffect(() => {
        init();

        return () => {
            if (_.isFunction(unsubscribe)) unsubscribe();
        };
    }, []);

    const init = async () => {
        const targetRecordId = params.recordId;
        const rpmsRef = collection(recordsRef, targetRecordId, 'rpms');

        unsubscribe = onSnapshot(rpmsRef, (querySnapshot) => {
            if (querySnapshot.empty) {
                alert('出錯！');
                return;
            }
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
