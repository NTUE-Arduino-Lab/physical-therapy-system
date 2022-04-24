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

import { recordsRef, usersRef } from '../../services/firebase';
import wait from '../../util/wait';

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

    useEffect(() => {
        init();

        return () => {
            if (_.isFunction(unsubscribeRecord)) unsubscribeRecord();
            if (_.isFunction(unsubscribePackets)) unsubscribePackets();
        };
    }, []);

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
        setRecord(record);
        setUser(user);
        setIsInitRecordDone(true);
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
        });
    };

    const listenPacketsChange = () => {
        const packetsRef = collection(recordsRef, params.recordId, 'packets');
        unsubscribePackets = onSnapshot(packetsRef, (querySnapshot) => {
            if (querySnapshot.empty) {
                alert('出錯！');
                return;
            }
            const newRpms = [];
            querySnapshot.forEach((doc) => {
                newRpms.push(doc.data());
            });

            newRpms.sort((a, b) => a.time - b.time);

            // TODO:
            // if the latest hit the limit value
            // show alarm
            setPackets(newRpms);
            setIsInitPacketsDone(true);
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

        const packetsRef = collection(recordsRef, params.recordId, 'packets');

        const time = (packets.length + 1) * 5;

        // simulate incoming rpm & heart rate
        const rpm = 30;
        const nextPacket = {
            time,
            rpm: rpm + packets.length,
            heartRate: 95 + packets.length,
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
            <button onClick={addRpmAndHeartRate}>
                手動新增一筆 RPM, Heart Rate 資料
            </button>
            <button onClick={goFinishWorkout}>結束騎乘</button>
            {isFinishing && <p>結束中...記得填上相關騎乘資訊！</p>}
        </div>
    );
};

export default MonitoringWorkout;
