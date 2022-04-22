import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    addDoc,
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
} from 'firebase/firestore';
import _ from '../../util/helper';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import {
    recordsRef,
    generateValidPairId,
    validatePairId,
} from '../../services/firebase';
import wait from '../../util/wait';

const initialRpm = {
    rpm: 0,
    time: 0,
};

let unsubscribe = null;

const PrepareWorkout = () => {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState();
    const [selectedDiff, setSelectedDiff] = useState();

    const [isInitializing, setIsInitializing] = useState(false);
    const [isPairing, setIsPairing] = useState(false);

    const [targetgetRecordId, setTargetRecordId] = useState();

    const [pairId, setPairId] = useState(); // 產生的不重複配對碼
    const [isAppConnected, setIsAppConnected] = useState(false);

    // for functionality testing
    const [inputPairId, setInputPairId] = useState(''); // 輸入的配對碼

    useEffect(() => {
        return () => {
            if (_.isFunction(unsubscribe)) unsubscribe();
        };
    }, []);

    useEffect(() => {
        console.log(
            'use effect received [targerRecordId] change: ' + targetgetRecordId,
        );
        if (targetgetRecordId == null) {
            return;
        }

        const targetRecordRef = doc(recordsRef, targetgetRecordId);
        unsubscribe = onSnapshot(targetRecordRef, (doc) => {
            const currData = doc.data();
            console.log('Current data: ', currData);
            if (currData?.isAppConnected) {
                setIsPairing(false);
                setIsAppConnected(true);
            }
        });

        // going to listen doc change!
    }, [targetgetRecordId]);

    const goDashboard = async () => {
        if (targetgetRecordId && confirm('確定離開，將刪除此筆新增的紀錄')) {
            const targetRecordRef = doc(recordsRef, targetgetRecordId);
            await deleteDoc(targetRecordRef);
        }
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goMonitoring = () => {
        navigate(`${ROUTE_PATH.monitoring_workout}/${targetgetRecordId}`);
    };

    const createRecord = async () => {
        if (selectedUser == null || selectedDiff == null) {
            alert('請選擇使用者及難度');
            return;
        }

        setIsInitializing(true);

        const targetHeartRate = 100;
        const upperLimitHeartRate = 120;
        const pairId = await generateValidPairId(); // later wil
        const isAppConnected = false;
        const user = selectedUser;
        const createdTime = Timestamp.now();
        const beginWorkoutTime = null;
        const finishedWorkoutTime = null;

        const targetRecordRef = await addDoc(recordsRef, {
            targetHeartRate,
            upperLimitHeartRate,
            pairId,
            isAppConnected,
            user,
            createdTime,
            beginWorkoutTime,
            finishedWorkoutTime,
        });
        console.log('Document written with ID: ', targetRecordRef.id);

        // initialize rpms collection
        await addDoc(
            collection(recordsRef, targetRecordRef.id, 'rpms'),
            initialRpm,
        );

        setIsInitializing(false);
        setTargetRecordId(targetRecordRef.id);
        setPairId(pairId);

        // targetHeartRate
        // upperLimitHeartRate
        // pairId
        // isAppConnected
        // user
        // beginWorkoutTime
        // finishedWorkoutTime
        // createdTime
    };

    const pairWithApp = async () => {
        setIsPairing(true);

        const theRecordId = await validatePairId(inputPairId);

        if (!theRecordId) {
            alert('配對碼有誤或非本次記錄的配對碼');
            setIsPairing(false);
            setIsAppConnected(false);
            return;
        }

        // update the isAppConnected Field!
        const targetRecordRef = doc(recordsRef, theRecordId);
        await wait(1500);
        await updateDoc(targetRecordRef, {
            isAppConnected: true,
        });
    };

    const onUserChange = (e) => setSelectedUser(e.target.value);
    const onDiffChange = (e) => setSelectedDiff(e.target.value);

    return (
        <div className={styles.container}>
            <h1>準備騎車車囉！</h1>
            <button onClick={goDashboard}>回去選單</button>
            <label>現在是誰在騎：</label>
            <select value={selectedUser} onChange={onUserChange}>
                <option>請選擇騎乘者</option>
                <option value="9928ZTdBUebNeUoe2Gj2">Murphy</option>
                <option value="azFwPlEh6L9kRnxQtZM8">Allen</option>
            </select>
            <br />
            <label>騎乘難度是：</label>
            <select value={selectedDiff} onChange={onDiffChange}>
                <option>選擇騎乘難度</option>
                <option value="MOFmaft3pG7ECZoTsweR">
                    清幽小徑・目標心率 100・上限心率 120
                </option>
            </select>
            <button onClick={createRecord}>確定完成，下一步</button>

            {isInitializing && <p>初始化生成配對碼中...</p>}
            <h2>
                配對碼: {pairId} {pairId && <span>(稍待與 App 的配對)</span>}
            </h2>

            {pairId && (
                <div className={styles.pairing}>
                    <describe>模擬在 App 端的操作</describe>
                    <label>請輸入四位數配對碼：</label>
                    <input
                        value={inputPairId}
                        onChange={(e) => setInputPairId(e.target.value)}
                    />
                    <button onClick={pairWithApp} disabled={isAppConnected}>
                        我要配對
                    </button>
                    {isPairing && <p>配對中...</p>}
                </div>
            )}
            {isAppConnected && (
                <div className={styles.success}>
                    <h3>APP 配對成功!!</h3>
                    <button onClick={goMonitoring}>前往監視畫面</button>
                </div>
            )}
        </div>
    );
};

export default PrepareWorkout;
