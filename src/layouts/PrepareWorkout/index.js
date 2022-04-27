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
import { Statistic } from 'antd';
import _ from '../../util/helper';

import { ROUTE_PATH, VALID_MIN } from '../../constants';
import styles from './styles.module.scss';

import {
    recordsRef,
    generateValidPairId,
    validateInputPairId,
} from '../../services/firebase';
import wait from '../../util/wait';

const { Countdown } = Statistic;

const initialPacket = {
    rpm: 0,
    time: 0,
    heartRate: 0,
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
    const [pairDeadline, setPairDeadline] = useState();

    // for functionality testing
    const [inputPairId, setInputPairId] = useState(''); // 輸入的配對碼

    useEffect(() => {
        return () => {
            if (_.isFunction(unsubscribe)) unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (_.isEmpty(targetgetRecordId)) {
            return;
        }

        const targetRecordRef = doc(recordsRef, targetgetRecordId);
        unsubscribe = onSnapshot(targetRecordRef, async (doc) => {
            const currData = doc.data();
            if (currData?.pairId == null) {
                // App 端連線後，會將 pairId 設成 null
                // 藉由監聽是否為 null，判斷是否連上
                // 若連上更新 record 的 [isAppConnected] 為 true
                if (currData?.isAppConnected == false) {
                    await updateDoc(targetRecordRef, {
                        isAppConnected: true,
                    });

                    setPairDeadline(null);
                    setIsPairing(false);
                    setIsAppConnected(true);
                }
            }
        });

        // going to listen doc change!
    }, [targetgetRecordId]);

    const goDashboard = async () => {
        if (targetgetRecordId && confirm('確定離開，將刪除此筆新增的紀錄')) {
            await deleteRecord();
        }
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goMonitoring = () => {
        navigate(`${ROUTE_PATH.monitoring_workout}/${targetgetRecordId}`, {
            replace: true,
        });
    };

    const createRecord = async () => {
        if (selectedUser == null || selectedDiff == null) {
            alert('請選擇使用者及難度');
            return;
        }

        setIsInitializing(true);

        // will changed
        const targetHeartRate = 100; // careful the type
        const upperLimitHeartRate = 120; // careful the type
        // constant
        const user = selectedUser;
        const difficulty = selectedDiff;
        const pairId = await generateValidPairId();
        const isAppConnected = false;
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
            difficulty,
        });
        console.log('Document written with ID: ', targetRecordRef.id);

        // initialize sub collection - rpms
        await addDoc(
            collection(recordsRef, targetRecordRef.id, 'packets'),
            initialPacket,
        );

        setIsInitializing(false);
        setTargetRecordId(targetRecordRef.id);
        setPairId(pairId);

        // start a count-down
        const deadline = Date.now() + 1000 * 60 * VALID_MIN;
        setPairDeadline(deadline);

        // targetHeartRate
        // upperLimitHeartRate
        // pairId
        // isAppConnected
        // user
        // beginWorkoutTime
        // finishedWorkoutTime
        // createdTime
        // difficulty
    };

    const deleteRecord = async () => {
        const targetRecordRef = doc(recordsRef, targetgetRecordId);
        await deleteDoc(targetRecordRef);
    };

    // for functionality testing
    const pairWithApp = async () => {
        setIsPairing(true);

        const theRecordId = await validateInputPairId(inputPairId);

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
            pairId: null,
        });
    };

    const onDeadlineExpired = async () => {
        alert('連結過期，請重新選擇！');

        await wait(5000);
        await deleteRecord();
        setTargetRecordId(null);
        setPairId(null);
        setSelectedUser('');
        setSelectedDiff('');
        setPairDeadline(null);
        setInputPairId(null);
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
                    清幽小徑・25 分鐘・目標心率 100・上限心率 120
                </option>
            </select>
            <button onClick={createRecord}>確定完成，下一步</button>

            {isInitializing && <p>初始化生成配對碼中...</p>}
            <h2>
                配對碼: {pairId} {pairId && <span>(稍待與 App 的配對)</span>}
            </h2>
            {pairDeadline && (
                <Countdown
                    title="有效時間"
                    value={pairDeadline}
                    onFinish={onDeadlineExpired}
                />
            )}
            {pairId && (
                <div className={styles.pairing}>
                    <p className={styles.caption}>模擬在 App 端的操作</p>
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
