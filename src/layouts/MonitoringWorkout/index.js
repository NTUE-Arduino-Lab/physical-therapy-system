import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    onSnapshot,
    collection,
    addDoc,
    doc,
    updateDoc,
    Timestamp,
    getDoc,
} from 'firebase/firestore';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';

import { recordsRef } from '../../services/firebase';
import wait from '../../util/wait';

let unsubscribeRpms = null;
let unsubscribeHR = null;

const MonitoringWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [rpms, setRpms] = useState([]);
    const [heartRates, setHeartRates] = useState([]);
    const [isFinishing, setIsFinishing] = useState(false);

    useEffect(() => {
        init();

        return () => {
            if (_.isFunction(unsubscribeRpms)) unsubscribeRpms();
            if (_.isFunction(unsubscribeHR)) unsubscribeHR();
        };
    }, []);

    const init = async () => {
        const rpmsRef = collection(recordsRef, params.recordId, 'rpms');
        const heartRatesRef = collection(
            recordsRef,
            params.recordId,
            'heartRates',
        );

        unsubscribeRpms = onSnapshot(rpmsRef, (querySnapshot) => {
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

        unsubscribeHR = onSnapshot(heartRatesRef, (querySnapshot) => {
            if (querySnapshot.empty) {
                alert('出錯！');
                return;
            }
            const newHeartRates = [];
            querySnapshot.forEach((doc) => {
                newHeartRates.push(doc.data());
            });

            newHeartRates.sort((a, b) => a.time - b.time);

            // TODO:
            // if the latest hit the limit value
            // show alarm

            setHeartRates(newHeartRates);
        });
    };

    // for prototype testing
    const addRpmAndHeartRate = async () => {
        // set the begin time
        const recordRef = doc(recordsRef, params.recordId);
        const recordSnapshot = await getDoc(recordRef);
        const record = recordSnapshot.data();
        if (record.beginWorkoutTime == null) {
            await updateDoc(recordRef, {
                beginWorkoutTime: Timestamp.now(),
            });
        }

        const rpmsRef = collection(recordsRef, params.recordId, 'rpms');
        const heartRatesRef = collection(
            recordsRef,
            params.recordId,
            'heartRates',
        );

        const time = (rpms.length + 1) * 5;

        // simulate incoming rpm & heart rate
        const rpm = 30;
        const nextRpmValue = {
            time,
            rpm: rpm + rpms.length,
        };
        const nextHeartRate = {
            time,
            heartRate: 95 + rpms.length,
        };
        await addDoc(rpmsRef, nextRpmValue);
        await addDoc(heartRatesRef, nextHeartRate);
    };

    const goFinishWorkout = async () => {
        const recordRef = doc(recordsRef, params.recordId);

        setIsFinishing(true);

        await wait(2000);
        await updateDoc(recordRef, {
            finishedWorkoutTime: Timestamp.now(),
        });

        setIsFinishing(false);

        navigate(`${ROUTE_PATH.finsished_workout}/${params.recordId}`);
    };

    return (
        <div className={styles.container}>
            <table>
                <thead>
                    <tr>
                        <th>時間</th>
                        <th>rpm</th>
                    </tr>
                </thead>
                <tbody>
                    {rpms.map((el) => (
                        <tr key={el.time}>
                            <td>{el.time}</td>
                            <td>{el.rpm}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <table>
                <thead>
                    <tr>
                        <th>時間</th>
                        <th>心率</th>
                    </tr>
                </thead>
                <tbody>
                    {heartRates.map((el) => (
                        <tr key={el.time}>
                            <td>{el.time}</td>
                            <td>{el.heartRate}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p>This is monitoring page</p>
            <button onClick={addRpmAndHeartRate}>
                手動新增一筆 RPM, Heart Rate 資料
            </button>
            <button onClick={goFinishWorkout}>Finish workout</button>
            {isFinishing && <p>結束中...</p>}
        </div>
    );
};

export default MonitoringWorkout;
