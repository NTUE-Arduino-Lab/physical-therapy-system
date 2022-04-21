import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { recordsRef } from '../../services/firebase';

const PrepareWorkout = () => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState();
    const [selectedDiff, setSelectedDiff] = useState();

    const [targetgetRecordId, setTargetRecordId] = useState();

    // for functionality testing
    // const [paridId, setPairId] = useState();

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goMonitoring = () => {
        // navigate(`${ROUTE_PATH.monitoring_workout}/${targetgetRecordId}`);
        console.log(targetgetRecordId);
        navigate(`${ROUTE_PATH.monitoring_workout}/KlqQMArEQAF6pSRQrlYJ`);
    };

    const createRecord = async () => {
        if (selectedUser == null || selectedDiff == null) {
            alert('請選擇使用者及難度');
            return;
        }

        const targetHeartRate = 100;
        const upperLimitHeartRate = 120;
        const pairId = '2345';
        const isAppConnected = false;
        const user = selectedUser;

        const targetRecordRef = await addDoc(recordsRef, {
            targetHeartRate,
            upperLimitHeartRate,
            pairId,
            isAppConnected,
            user,
        });
        console.log('Document written with ID: ', targetRecordRef.id);

        // initialize rpms collection
        await addDoc(collection(recordsRef, targetRecordRef.id, 'rpms'), {
            rpm: 0,
            time: 0,
        });

        setTargetRecordId(targetRecordRef.id);

        // targetHeartRate
        // upperLimitHeartRate
        // pairId
        // isAppConnected
        // user
    };

    const onUserChange = (e) => setSelectedUser(e.target.value);
    const onDiffChange = (e) => setSelectedDiff(e.target.value);

    return (
        <div className={styles.container}>
            <p>This is Prepare Workout</p>
            <button onClick={goDashboard}>go to dashboard</button>
            <label>請選擇使用者</label>
            <select value={selectedUser} onChange={onUserChange}>
                <option>選擇使用者</option>
                <option value="9928ZTdBUebNeUoe2Gj2">Murphy</option>
                <option value="azFwPlEh6L9kRnxQtZM8">Allen</option>
            </select>
            <br />
            <label>請選擇騎乘難度</label>
            <select value={selectedDiff} onChange={onDiffChange}>
                <option>選擇騎乘難度</option>
                <option value="MOFmaft3pG7ECZoTsweR">
                    清幽小徑・目標心率 100・上限心率 120
                </option>
            </select>
            <button onClick={createRecord}>開始新紀錄</button>
            <button onClick={goMonitoring}>go to monitoring</button>
        </div>
    );
};

export default PrepareWorkout;
