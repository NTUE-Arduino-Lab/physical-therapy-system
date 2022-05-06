/* eslint-disable no-unused-vars */
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
import moment from 'moment';
import { DualAxes as LineChart } from '@ant-design/plots';
import { Modal, Popover, Button, Input, message } from 'antd';
import { SettingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import { ROUTE_PATH, WARN, WARN_THRESHOLD } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';

import { recordsRef, usersRef, difficultiesRef } from '../../services/firebase';
import wait from '../../util/wait';
import useAudio from '../../util/useAudio';
import formatWithMoment from '../../util/formatSeconds';

import StopWatch from '../../components/StopWatch';

let unsubscribeRecord = null;
let unsubscribePackets = null;

const MonitoringWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [record, setRecord] = useState();
    const [user, setUser] = useState();
    const [difficulty, setDifficulty] = useState();
    const [packets, setPackets] = useState([]);

    const [isInitRecordDone, setIsInitRecordDone] = useState(false);
    const [isInitPacketsDone, setIsInitPacketsDone] = useState(false);

    const {
        playWarnSound,
        playOtherSound,
        OTHER_SOUND,
        getAudioPermission,
    } = useAudio();

    // 騎乘計時碼表
    const [beginStopWatch, setBeginStopWatch] = useState(false);

    // for prototype
    const [nextHeartRateVal, setNextHeartRateVal] = useState('');

    useEffect(() => {
        init();
        grantAudioPerssion();

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

    const grantAudioPerssion = () => {
        Modal.info({
            title: '提示：監控過程會產生提示聲響，請確保聲音打開！',
            // content: <button onClick={getAudioPermission}>點我測試;</button>,
            onOk() {
                getAudioPermission();
            },
            maskClosable: false,
        });
    };

    const formatBeginWorkoutTime = () => {
        if (_.isEmpty(record.beginWorkoutTime)) {
            return '';
        }

        return moment(record.beginWorkoutTime).format('YYYY/MM/DD HH:mm');
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
                    timeLabel: formatWithMoment(doc.data().time),
                });
            });

            newPackets.sort((a, b) => a.time - b.time);
            newPackets.splice(0, 1);

            setPackets(newPackets);
            setIsInitPacketsDone(true);
        });
    };

    const evaluateCurrPacket = (packet) => {
        console.log(packet);

        const targetHeartRate = record.targetHeartRate;
        const [overSlight, overMedium, overHigh] = getExactThresholdValue();

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

    const confirmFinish = () => {
        Modal.confirm({
            title: '即將結束！',
            icon: <ExclamationCircleOutlined />,
            content: '確定結束本次騎乘？',
            onOk: () => goFinishWorkout(),
        });
    };

    const goFinishWorkout = async () => {
        setBeginStopWatch(false);

        await wait(2000);
        const recordRef = doc(recordsRef, params.recordId);
        await updateDoc(recordRef, {
            finishedWorkoutTime: Timestamp.now(),
            pairId: null,
        });

        message.success({ content: '已結束！自動跳轉至統計畫面' });

        await wait(1000);
        navigate(`${ROUTE_PATH.finsished_workout}/${params.recordId}`, {
            replace: true,
        });
    };

    const getStopWatchInitialValue = () => {
        if (_.isEmpty(record?.beginWorkoutTime)) {
            return 0;
        }

        const begin = moment(record.beginWorkoutTime);
        const now = moment();
        const accumlated = moment.duration(now.diff(begin)).asMilliseconds();

        return accumlated;
    };

    if (!isInitRecordDone || !isInitPacketsDone || _.isEmpty(difficulty)) {
        return <div className={styles.container}>監控畫面初始化中...</div>;
    }

    const popoverContent = (
        <>
            <Input.Search
                placeholder="下個心率是？"
                allowClear
                enterButton="新增"
                size="Large"
                onChange={(e) => setNextHeartRateVal(e.target.value)}
                onSearch={addRpmAndHeartRate}
            />
            <Button onClick={confirmFinish}>結束騎乘</Button>
        </>
    );

    // TODO:
    // refactoring <table> to component
    return (
        <div className={styles.container}>
            <div className={styles.glass}>
                {/* <h1>騎乘監控畫面</h1> */}
                <div className={`${styles.col} ${styles.col1}`}>
                    <span>騎乘者：{user?.name}</span>
                    <span>騎乘者身體年齡：{user?.age}</span>
                </div>
                <div className={`${styles.col} ${styles.col2}`}>
                    <div className={styles.stopWatchWrapper}>
                        <span>騎乘進行了：</span>
                        <StopWatch
                            start={beginStopWatch}
                            initialValue={getStopWatchInitialValue()}
                        />
                    </div>
                    <caption>(開始於 {formatBeginWorkoutTime()})</caption>
                </div>
                <div className={`${styles.col} ${styles.col3}`}>
                    平均速率／心率
                </div>
                <div className={`${styles.col} ${styles.difficulty}`}>
                    <Popover
                        content={popoverContent}
                        placement="bottomRight"
                        title="更多操作"
                        trigger="click"
                    >
                        <SettingOutlined width={'1em'} />
                    </Popover>
                    <span>騎乘關卡：{difficulty.name}</span>
                    <span>目標心率：{difficulty.targetHeartRate}</span>
                    <span>上限心率：{difficulty.upperLimitHeartRate}</span>
                    <caption>
                        分階警示心率：{getExactThresholdValue()[0]}/
                        {getExactThresholdValue()[1]}/
                        {getExactThresholdValue()[2]}
                    </caption>
                </div>
                <div className={styles.mainCol}>
                    <LineChart {...configLineChart(packets)} />
                </div>
            </div>
        </div>
    );
};

const configLineChart = (data) => ({
    data: [data, data],
    xField: 'timeLabel',
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
    // xAxis: {
    //     title: {
    //         text: '時間',
    //     },
    // },
    legend: {
        itemName: {
            formatter: (text, item) => {
                return item.value === 'rpm' ? 'RPM值(單位？)' : '心率(單位？)';
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
                start: ['min', 138], // TODO: change [138] to 目標心率
                end: ['max', 138], // TODO: change [138] to 目標心率
                style: {
                    lineWidth: 2,
                    lineDash: [3, 3],
                    stroke: '#F4664A',
                },
                text: {
                    content: '目標心率(138)', // TODO: change [138] to 目標心率
                    offsetY: -4,
                    position: 'end',
                    style: {
                        textAlign: 'end',
                    },
                },
            },
        ],
    },
    tooltip: {
        showTitle: true,
    },
});

export default MonitoringWorkout;
