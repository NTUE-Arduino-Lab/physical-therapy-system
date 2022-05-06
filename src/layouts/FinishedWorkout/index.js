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
import { DualAxes as LineChart } from '@ant-design/plots';
import {
    Layout,
    Descriptions,
    PageHeader,
    Input,
    Button,
    message,
    Modal,
} from 'antd';
import { UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';
import formatWithMoment from '../../util/formatSeconds';
import wait from '../../util/wait';

import { recordsRef, usersRef, difficultiesRef } from '../../services/firebase';

const { Content } = Layout;

const FinishedWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [user, setUser] = useState();
    const [record, setRecord] = useState();
    const [packets, setPackets] = useState([]);
    const [difficulty, setDifficulty] = useState();

    const [isDone, setIsDone] = useState(false);

    // doctor says...
    const [therapist, setTherapist] = useState();
    const [comment, setComment] = useState();

    const [inputStatus, setInputStatus] = useState();

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
            packets.push({
                ...doc.data(),
                timeLabel: formatWithMoment(doc.data().time),
            });
        });

        packets.sort((a, b) => a.time - b.time);
        packets.splice(0, 1);

        // user
        const userRef = doc(usersRef, recordData.user);
        const userSnapshot = await getDoc(userRef);
        const user = userSnapshot.data();

        // difficulty
        const difficultyRef = doc(difficultiesRef, recordData.difficulty);
        const diffSnapshot = await getDoc(difficultyRef);
        const difficulty = diffSnapshot.data();

        // therapist & comment
        const therapist = record.therapist ?? '';
        const comment = record.comment ?? '';

        setUser(user);
        setRecord(record);
        setPackets(packets);
        setDifficulty(difficulty);
        setTherapist(therapist);
        setComment(comment);
        setIsDone(true);
    };

    const onFormSubmit = async (e) => {
        e.preventDefault();
        if (_.isEmpty(therapist)) {
            message.error('請填上治療師名稱');
            setInputStatus('error');
            return;
        }

        Modal.confirm({
            title: '即將提交！',
            icon: <ExclamationCircleOutlined />,
            content: '確定資料填寫無誤？',
            onOk: () => updateTherapistInfo(),
        });
    };

    const updateTherapistInfo = async () => {
        const recordRef = doc(recordsRef, params.recordId);
        await updateDoc(recordRef, {
            therapist: therapist,
            comment: comment,
        });

        message.success({ content: '已提交！自動跳轉至選單畫面' });

        await wait(1000);
        navigate(ROUTE_PATH.admin_dashbaord, { replace: true });
    };

    const calWorkoutTime = () => {
        const begin = moment(record.beginWorkoutTime);
        const end = moment(record.finishedWorkoutTime);

        const diff = moment.duration(end.diff(begin)).asMilliseconds();

        console.log(diff);

        const h = ('0' + Math.floor(diff / 3600000)).slice(-2);
        const m = ('0' + Math.floor((diff / 60000) % 60)).slice(-2);
        const s = ('0' + Math.floor((diff / 1000) % 60)).slice(-2);

        let returnStr = '';

        if (h != '00') returnStr += `${h} 小時 `;
        returnStr += `${m} 分 ${s} 秒`;

        return returnStr;
    };

    if (!isDone) {
        return (
            <Layout style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <PageHeader
                        className={styles.PageHeader}
                        title="紀錄資料讀取中..."
                    />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Content className="site-layout" style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <PageHeader
                        className={styles.PageHeader}
                        title="已結束騎乘，本次騎乘數據統計"
                        subTitle="請至下方填寫資訊"
                    />

                    <Descriptions bordered className={styles.descriptions}>
                        <Descriptions.Item label="騎乘者姓名" span={2}>
                            {user?.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="騎乘者身體年齡">
                            {user?.age}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <div>
                                    實際騎乘時間
                                    <br />/ 目標騎乘時間
                                </div>
                            }
                        >
                            {calWorkoutTime()}／{difficulty.targetWorkoutTime}{' '}
                            分
                        </Descriptions.Item>
                        <Descriptions.Item label="開始騎乘時間">
                            {record.beginWorkoutTime.toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="結束騎乘時間">
                            {record.finishedWorkoutTime.toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="騎乘關卡">
                            {difficulty.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="目標心率">
                            {difficulty.targetHeartRate}
                        </Descriptions.Item>
                        <Descriptions.Item label="上限心率">
                            {difficulty.upperLimitHeartRate}
                        </Descriptions.Item>
                        <Descriptions.Item label="RPM＆心率統計圖">
                            <LineChart {...configLineChart(packets)} />
                        </Descriptions.Item>
                    </Descriptions>

                    <div className={styles.form}>
                        <h3>請填寫以下資料，方可返回主選單</h3>

                        <Input
                            size="large"
                            placeholder="物理治療師名稱"
                            prefix={<UserOutlined />}
                            value={therapist}
                            onChange={(e) => {
                                setTherapist(e.target.value);
                                setInputStatus();
                            }}
                            status={inputStatus}
                        />
                        <Input.TextArea
                            showCount
                            placeholder="治療結果評語"
                            maxLength={50}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={{ marginTop: 16 }}
                        />

                        <Button
                            onClick={onFormSubmit}
                            type="primary"
                            style={{ marginTop: 16 }}
                        >
                            提交，返回主選單
                        </Button>
                    </div>
                </div>
            </Content>
        </Layout>
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

export default FinishedWorkout;
