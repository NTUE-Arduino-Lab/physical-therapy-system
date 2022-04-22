import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { recordsRef } from '../../services/firebase';

const FinishedWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [rpms, setRpms] = useState([]);
    const [heartRates, setHeartRates] = useState([]);
    const [record, setRecord] = useState({});

    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const rpmsRef = collection(recordsRef, params.recordId, 'rpms');
        const recordRef = doc(recordsRef, params.recordId);
        const heartRatesRef = collection(
            recordsRef,
            params.recordId,
            'heartRates',
        );

        // rpms
        const rpms = [];
        const rpmsSnapshot = await getDocs(rpmsRef);
        rpmsSnapshot.forEach((doc) => {
            rpms.push(doc.data());
        });
        rpms.sort((a, b) => a.time - b.time);

        // heart rates
        const heartRates = [];
        const hrSnapshot = await getDocs(heartRatesRef);
        hrSnapshot.forEach((doc) => {
            heartRates.push(doc.data());
        });
        heartRates.sort((a, b) => a.time - b.time);

        // record
        const recordSnapshot = await getDoc(recordRef);
        const recordData = recordSnapshot.data();
        const record = {
            ...recordData,
            beginWorkoutTime: recordData.beginWorkoutTime.toDate(),
            finishedWorkoutTime: recordData.finishedWorkoutTime.toDate(),
        };

        setRecord(record);
        setRpms(rpms);
        setHeartRates(heartRates);
        setIsDone(true);
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    // TODO:
    // add therapist, comment
    return (
        <div className={styles.container}>
            <p>This is FinishedWorkout page</p>
            {!isDone && <div>資料讀取中...</div>}
            {isDone && (
                <>
                    <h3>RPMS</h3>
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
                    <h3>Heart Rates</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>時間</th>
                                <th>rpm</th>
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
                    <h3>
                        開始騎乘時間：{record.beginWorkoutTime.toLocaleString()}
                    </h3>
                    <h3>
                        結束騎乘時間：
                        {record.finishedWorkoutTime.toLocaleString()}
                    </h3>
                    <button onClick={goDashboard}>go to dashboard</button>
                </>
            )}
        </div>
    );
};

export default FinishedWorkout;
