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
// import moment from 'moment';
import { DualAxes as LineChart } from '@ant-design/plots';

import { ROUTE_PATH, WARN, WARN_THRESHOLD } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';

import { recordsRef, usersRef, difficultiesRef } from '../../services/firebase';
import wait from '../../util/wait';
import useAudio from '../../util/useAudio';

import Timer from '../../components/Timer';

let unsubscribeRecord = null;
let unsubscribePackets = null;

const MonitoringWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [record, setRecord] = useState();
    const [user, setUser] = useState();
    const [difficulty, setDifficulty] = useState();
    const [packets, setPackets] = useState([]);
    const [isFinishing, setIsFinishing] = useState(false);

    const [isInitRecordDone, setIsInitRecordDone] = useState(false);
    const [isInitPacketsDone, setIsInitPacketsDone] = useState(false);

    const { playWarnSound, playOtherSound, OTHER_SOUND } = useAudio();

    // 騎乘計時碼表
    const [beginStopWatch, setBeginStopWatch] = useState(false);

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
        if (_.isEmpty(record?.beginWorkoutTime)) return;

        const begin = record.beginWorkoutTime;
        const end = record.finishedWorkoutTime;

        if (_.isNotEmpty(begin)) setBeginStopWatch(true);
        if (_.isNotEmpty(end)) setBeginStopWatch(false);
    }, [record]);

    useEffect(() => {
        if (_.isEmpty(record)) return;
        if (!isInitRecordDone || !isInitPacketsDone) return;

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

        // user
        const userRef = doc(usersRef, recordData.user);
        const userSnapshot = await getDoc(userRef);
        const user = userSnapshot.data();

        // difficulty
        const difficultyRef = doc(difficultiesRef, recordData.difficulty);
        const diffSnapshot = await getDoc(difficultyRef);
        const difficulty = diffSnapshot.data();

        setUser(user);
        setDifficulty(difficulty);
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
                newPackets.push({
                    ...doc.data(),
                    time: doc.data().time.toString(),
                });
            });

            newPackets.sort((a, b) => a.time - b.time);
            newPackets.splice(0, 1);

            // console.table(newPackets);

            setPackets(newPackets);
            setIsInitPacketsDone(true);
        });
    };

    const evaluateCurrPacket = (packet) => {
        console.log(packet);

        const targetHeartRate = record.targetHeartRate;
        // const upperLimitHeartRate = record.upperLimitHeartRate;

        const [overSlight, overMedium, overHigh] = getExactThresholdValue();

        // const calBase = upperLimitHeartRate / 100;
        // const overHigh = Math.floor(calBase * WARN_THRESHOLD.High);
        // const overMedium = Math.floor(calBase * WARN_THRESHOLD.Medium);
        // const overSlight = Math.floor(calBase * WARN_THRESHOLD.Slight);

        if (packet.heartRate >= overHigh) {
            console.log('playing: high warn');
            playWarnSound(WARN.High);
        } else if (
            packet.heartRate < overHigh &&
            packet.heartRate >= overMedium
        ) {
            console.log('playing: medium warn');
            playWarnSound(WARN.Medium);
        } else if (
            packet.heartRate < overMedium &&
            packet.heartRate >= overSlight
        ) {
            console.log('playing: slight warn');
            playWarnSound(WARN.Slight);
        } else if (
            packet.heartRate >= targetHeartRate &&
            packet.heartRate < overSlight
        ) {
            console.log('playing: archieved');
            playOtherSound(OTHER_SOUND.Archieved);
        }
    };

    const getExactThresholdValue = () => {
        const upperLimitHeartRate = record.upperLimitHeartRate;

        const calBase = upperLimitHeartRate / 100;
        const overHigh = Math.floor(calBase * WARN_THRESHOLD.High);
        const overMedium = Math.floor(calBase * WARN_THRESHOLD.Medium);
        const overSlight = Math.floor(calBase * WARN_THRESHOLD.Slight);

        return [overSlight, overMedium, overHigh];
    };

    // 重整後取得累計的時間 未完
    // const getAccumlatedTime = () => {
    //     if (_.isEmpty(record?.beginWorkoutTime)) {
    //         return 0;
    //     }

    //     const begin = moment(record.beginWorkoutTime);
    //     const accumlated = moment
    //         .duration(refreshTime.diff(begin))
    //         .asMilliseconds();

    //     console.log('trigger get acum');
    //     console.log(accumlated);
    //     return accumlated;
    // };

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
        setBeginStopWatch(false);

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

    if (!isInitRecordDone || !isInitPacketsDone || _.isEmpty(difficulty)) {
        return <div className={styles.container}>監控畫面初始化中...</div>;
    }

    // TODO:
    // refactoring <table> to component
    return (
        <div className={styles.container}>
            {/* <h1>騎乘監控畫面</h1> */}
            <div className={styles.col}>
                <p>騎乘者：{user?.name}</p>
                <p>騎乘者身體年齡：{user?.age}</p>
            </div>
            <div className={styles.col}>
                <p>騎乘進行了多久：</p>
                <Timer start={beginStopWatch} />
                <caption>
                    (開始於 {record.beginWorkoutTime?.toLocaleString()})
                </caption>
            </div>
            <div className={styles.col}>平均速率／心率</div>
            <div className={`${styles.col} ${styles.difficulty}`}>
                <p>騎乘關卡：{difficulty.name}</p>
                <p>目標心率:{difficulty.targetHeartRate}</p>
                <p>上限心率：{difficulty.upperLimitHeartRate}</p>
                <caption>一階警示心率：{getExactThresholdValue()[0]}</caption>
                <caption>二階警示心率：{getExactThresholdValue()[1]}</caption>
                <caption>三階警示心率：{getExactThresholdValue()[2]}</caption>
            </div>
            <div className={styles.mainCol}>
                {/* <table>
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
                </table> */}
                <LineChart {...configLineChart(packets)} />
            </div>
            <div className={styles.col}>
                <label>下個心率？</label>
                <input
                    value={nextHeartRateVal}
                    onChange={(e) => setNextHeartRateVal(e.target.value)}
                />
                <button onClick={addRpmAndHeartRate}>
                    手動新增一筆 RPM, Heart Rate 資料
                </button>
            </div>
            <div className={styles.col}>
                {' '}
                <button onClick={goFinishWorkout}>結束騎乘</button>
                {isFinishing && <p>結束中...記得填上相關騎乘資訊！</p>}
            </div>
        </div>
    );
};

const configLineChart = (data) => {
    const dataClone = JSON.parse(JSON.stringify(data));
    console.table(dataClone);
    return {
        data: [dataClone, dataClone],
        xField: 'time',
        yField: ['rpm', 'heartRate'],
        yAxis: {
            rpm: {
                title: {
                    text: 'RPM',
                },
            },
            heartRate: {
                title: {
                    text: '心率',
                },
            },
        },
        xAxis: {
            title: {
                text: '時間（秒）',
            },
        },
        legend: {
            itemName: {
                formatter: (text, item) => {
                    return item.value === 'rpm'
                        ? 'RPM值(單位？)'
                        : '心率(單位？)';
                },
            },
        },
        meta: {
            rpm: {
                alias: 'RPM值 ',
                formatter: (value) => {
                    return `${value} 單位？`;
                },
            },
            heartRate: {
                alias: '心率',
                formatter: (value) => {
                    return `${value} 單位？`;
                    // return Number((v / 100).toFixed(1));
                },
            },
        },
        geometryOptions: [
            {
                geometry: 'line',
                color: '#5B8FF9',
                lineStyle: {
                    lineWidth: 2,
                    lineDash: [5, 5],
                },
            },
            {
                geometry: 'line',
                color: '#5AD8A6',
                smooth: true,
                lineStyle: {
                    lineWidth: 4,
                    opacity: 0.5,
                },
                point: {
                    shape: 'circle',
                    size: 4,
                    style: {
                        opacity: 0.5,
                        stroke: '#5AD8A6',
                        fill: '#fff',
                    },
                },
            },
        ],
        annotations: {
            heartRate: [
                {
                    type: 'line',
                    // top: true,
                    start: ['min', 138],
                    end: ['max', 138],
                    style: {
                        lineWidth: 2,
                        lineDash: [3, 3],
                        stroke: '#F4664A',
                    },
                    text: {
                        content: '目標心率',
                        offsetY: -4,
                        position: 'end',
                        style: {
                            textAlign: 'end',
                        },
                    },
                },
            ],
        },
    };
};

export default MonitoringWorkout;
