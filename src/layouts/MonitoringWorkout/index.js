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

import { ROUTE_PATH, WARN, WARN_THRESHOLD } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';

import { recordsRef, usersRef } from '../../services/firebase';
import wait from '../../util/wait';
import useAudio from '../../util/useAudio';

let unsubscribeRecord = null;
let unsubscribePackets = null;

const MonitoringWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [record, setRecord] = useState();
    const [user, setUser] = useState();
    const [packets, setPackets] = useState([]);
    const [isFinishing, setIsFinishing] = useState(false);

    const [isInitRecordDone, setIsInitRecordDone] = useState(false);
    const [isInitPacketsDone, setIsInitPacketsDone] = useState(false);

    const { playWarnSound, playOtherSound, OTHER_SOUND } = useAudio();

    // for prototype
    const [nextHeartRateVal, setNextHeartRateVal] = useState('');

    useEffect(() => {
        init();

        return () => {
            if (_.isFunction(unsubscribeRecord)) unsubscribeRecord();
            if (_.isFunction(unsubscribePackets)) unsubscribePackets();
        };
    }, []);

    useEffect(() => {
        evaluateCurrPacket(packets[packets.length - 1]);
    }, [packets]);

    const init = async () => {
        checkIntegrity();
        listenRecordChange();
        listenPacketsChange();
    };

    const checkIntegrity = async () => {
        const recordRef = doc(recordsRef, params.recordId);
        const recordSnapshot = await getDoc(recordRef);
        const recordData = recordSnapshot.data();
        // check if a valid record
        if (recordData.finishedWorkoutTime != null) {
            alert('此筆紀錄已完成，將自動導回首頁！');
            navigate(ROUTE_PATH.admin_dashbaord);
        }

        const userRef = doc(usersRef, recordData.user);
        const userSnapshot = await getDoc(userRef);
        const user = userSnapshot.data();
        setUser(user);
    };

    const listenRecordChange = async () => {
        const recordRef = doc(recordsRef, params.recordId);
        unsubscribeRecord = onSnapshot(recordRef, async (recordSnapshot) => {
            const recordData = recordSnapshot.data();
            const record = {
                ...recordData,
                beginWorkoutTime: recordData.beginWorkoutTime?.toDate(),
            };

            setRecord(record);
            setIsInitRecordDone(true);
        });
    };

    const listenPacketsChange = () => {
        const packetsRef = collection(recordsRef, params.recordId, 'packets');

        unsubscribePackets = onSnapshot(packetsRef, (querySnapshot) => {
            if (querySnapshot.empty) {
                alert('監測數據有誤，請重新配對，即將退回選擇畫面！');
                navigate(ROUTE_PATH.prepare_workout, { replace: true });
                return;
            }
            const newPackets = [];
            querySnapshot.forEach((doc) => {
                newPackets.push(doc.data());
            });

            newPackets.sort((a, b) => a.time - b.time);

            setPackets(newPackets);
            setIsInitPacketsDone(true);
        });
    };

    const evaluateCurrPacket = (packet) => {
        // console.log(record);
        // console.log('isInitRecordDone: ' + isInitRecordDone);
        // console.log('isInitPacketsDone: ' + isInitPacketsDone);

        if (_.isEmpty(record)) {
            return;
        }
        if (!isInitRecordDone || !isInitPacketsDone) {
            return;
        }

        console.log(packet);

        const targetHeartRate = record.targetHeartRate;
        const upperLimitHeartRate = record.upperLimitHeartRate;

        const calBase = upperLimitHeartRate / 100;

        const currHearRate = packet.heartRate;
        if (currHearRate > calBase * WARN_THRESHOLD.High) {
            console.log('playing: high warn');
            playWarnSound(WARN.High);
        } else if (
            currHearRate < calBase * WARN_THRESHOLD.High &&
            currHearRate > calBase * WARN_THRESHOLD.Medium
        ) {
            console.log('playing: medium warn');
            playWarnSound(WARN.Medium);
        } else if (
            currHearRate < calBase * WARN_THRESHOLD.Medium &&
            currHearRate > calBase * WARN_THRESHOLD.Slight
        ) {
            console.log('playing: slight warn');
            playWarnSound(WARN.Slight);
        } else if (
            currHearRate > targetHeartRate &&
            currHearRate < upperLimitHeartRate
        ) {
            console.log('playing: archieved');
            playOtherSound(OTHER_SOUND.Archieved);
        }
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

        const packetsRef = collection(recordsRef, params.recordId, 'packets');

        const time = (packets.length + 1) * 5;
        const heartRate = _.isNotEmpty(nextHeartRateVal)
            ? parseInt(nextHeartRateVal)
            : 95 + packets.length;

        // simulate incoming rpm & heart rate
        const rpm = 30;
        const nextPacket = {
            time,
            rpm: rpm + packets.length,
            heartRate: heartRate,
        };

        await addDoc(packetsRef, nextPacket);
    };

    const goFinishWorkout = async () => {
        if (!confirm('確定結束本次騎乘？')) {
            return;
        }

        setIsFinishing(true);

        const recordRef = doc(recordsRef, params.recordId);

        await wait(2000);
        await updateDoc(recordRef, {
            finishedWorkoutTime: Timestamp.now(),
            pairId: null,
        });

        setIsFinishing(false);

        navigate(`${ROUTE_PATH.finsished_workout}/${params.recordId}`, {
            replace: true,
        });
    };

    if (!isInitRecordDone || !isInitPacketsDone) {
        return <div className={styles.container}>監控畫面初始化中...</div>;
    }

    // TODO:
    // refactoring <table> to component
    return (
        <div className={styles.container}>
            <h1>騎乘監控畫面</h1>
            <p>騎乘者：{user?.name}</p>
            <p>騎乘者身體年齡：{user?.age}</p>
            <p>騎乘開始時間：{record?.beginWorkoutTime?.toLocaleString()}</p>
            <label>下個心率？</label>
            <input
                value={nextHeartRateVal}
                onChange={(e) => setNextHeartRateVal(e.target.value)}
            />
            <button onClick={addRpmAndHeartRate}>
                手動新增一筆 RPM, Heart Rate 資料
            </button>
            <table>
                <thead>
                    <tr>
                        <th>時間</th>
                        <th>rpm</th>
                        <th>心率</th>
                    </tr>
                </thead>
                <tbody>
                    {packets.map((el) => (
                        <tr key={el.time}>
                            <td>{el.time}</td>
                            <td>{el.rpm}</td>
                            <td>{el.heartRate}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={goFinishWorkout}>結束騎乘</button>
            {isFinishing && <p>結束中...記得填上相關騎乘資訊！</p>}
        </div>
    );
};

export default MonitoringWorkout;
