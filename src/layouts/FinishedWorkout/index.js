import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
} from 'firebase/firestore';
import moment from 'moment';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';

import { recordsRef, usersRef, difficultiesRef } from '../../services/firebase';

const FinishedWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [user, setUser] = useState();
    const [record, setRecord] = useState();
    const [packets, setPackets] = useState([]);
    const [difficulty, setDifficulty] = useState();

    const [isDone, setIsDone] = useState(false);
    const [isCommented, setIsCommented] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const recordRef = doc(recordsRef, params.recordId);
        const packetsRef = collection(recordsRef, params.recordId, 'packets');

        // record
        const recordSnapshot = await getDoc(recordRef);
        const recordData = recordSnapshot.data();
        if (
            recordData.pairId != null ||
            recordData.finishedWorkoutTime == null
        ) {
            alert('此筆紀錄尚未完成，將自動導回首頁！');
            navigate(ROUTE_PATH.admin_dashbaord);
            return;
        }
        const record = {
            ...recordData,
            beginWorkoutTime: recordData.beginWorkoutTime.toDate(),
            finishedWorkoutTime: recordData.finishedWorkoutTime.toDate(),
        };

        // packets
        const packets = [];
        const packetsSnapshot = await getDocs(packetsRef);
        packetsSnapshot.forEach((doc) => {
            packets.push(doc.data());
        });
        packets.sort((a, b) => a.time - b.time);

        // user
        const userRef = doc(usersRef, recordData.user);
        const userSnapshot = await getDoc(userRef);
        const user = userSnapshot.data();

        // difficulty
        const difficultyRef = doc(difficultiesRef, recordData.difficulty);
        const diffSnapshot = await getDoc(difficultyRef);
        const difficulty = diffSnapshot.data();

        setUser(user);
        setRecord(record);
        setPackets(packets);
        setDifficulty(difficulty);
        setIsDone(true);
    };

    const onFormSubmit = async (e) => {
        // e.validateForm();
        e.preventDefault();
        const { therapist, comment } = e.target;

        if (_.isEmpty(therapist.value)) {
            alert('請填上治療師名稱');
            return;
        }
        const recordRef = doc(recordsRef, params.recordId);
        await updateDoc(recordRef, {
            therapist: therapist.value,
            comment: comment.value,
        });

        setIsCommented(true);
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const calWorkoutTime = () => {
        const begin = moment(record.beginWorkoutTime);
        const end = moment(record.finishedWorkoutTime);

        const diff = moment.duration(end.diff(begin)).asMilliseconds();

        return moment.utc(diff).format('h 小時 mm 分');
    };

    if (!isDone) {
        return <div>紀錄資料讀取中...</div>;
    }

    return (
        <div className={styles.container}>
            <h1>已結束騎乘，本次騎乘數據統計</h1>
            <p>騎乘者：{user?.name}</p>
            <p>騎乘者身體年齡：{user?.age}</p>
            <p>
                騎乘關卡：{difficulty.name}・目標心率{' '}
                {difficulty.targetHeartRate}・上限心率{' '}
                {difficulty.upperLimitHeartRate}
            </p>
            <p>
                實際騎乘時間／目標騎乘時間：{calWorkoutTime()}／
                {difficulty.targetWorkoutTime} 分
            </p>
            <p>開始騎乘時間：{record.beginWorkoutTime.toLocaleString()}</p>
            <p>
                結束騎乘時間：
                {record.finishedWorkoutTime.toLocaleString()}
            </p>
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
            <h3>請具填以下資料，方可返回主選單</h3>
            {/* 
                TODO:
                after UI library added, change back to controll mode 
            */}
            <form onSubmit={onFormSubmit} className={styles.form}>
                <label htmlFor="therapist">物理治療師名稱</label>
                <br />
                <input
                    type="text"
                    id="therapist"
                    name="therapist"
                    required
                ></input>
                <br />
                <label htmlFor="comment">治療結果評語</label>
                <br />
                <textarea id="comment" name="comment"></textarea>
                <input
                    type="submit"
                    value="Submit"
                    className={styles.submit}
                ></input>
            </form>

            <button onClick={goDashboard} disabled={!isCommented}>
                返回主選單
            </button>
        </div>
    );
};

export default FinishedWorkout;
