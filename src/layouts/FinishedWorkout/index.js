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
    Space,
} from 'antd';
import {
    UserOutlined,
    ExclamationCircleOutlined,
    LineChartOutlined,
    EditOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import { StylesManager, Model } from 'survey-core';
import { Survey } from 'survey-react-ui';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';
import formatWithMoment from '../../util/formatSeconds';
import wait from '../../util/wait';
import configLineChart from '../../util/configLineChart';

import { recordsRef, usersRef, difficultiesRef } from '../../services/firebase';

import SixSurveyJson from '../../assets/surveys/sixSurvey.json';
import COPDSurveyJson from '../../assets/surveys/copdSurvey.json';
import SGRSurveyJson from '../../assets/surveys/sgrSurvey.json';
import BorgScaleSurveyJson from '../../assets/surveys/borgScaleSurvey.json';
import 'survey-core/defaultV2.css';
StylesManager.applyTheme('defaultV2');
const sixSurveyJson = SixSurveyJson;
const copdSurveyJson = COPDSurveyJson;
const sgrSurveyJson = SGRSurveyJson;
const borgScaleSurveyJson = BorgScaleSurveyJson;

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

    // 安全心律上線指數、心律變異指數、SPO2
    const [safeHRIndex, setSafeHRIndex] = useState();
    const [hrVariabilityIndex, setHRVariabilityIndex] = useState();
    const [spo2, setSpo2] = useState();

    // survey control
    const [surveyModalVisible, setSurveyModalVisible] = useState(false);
    const [curSurveyName, setCurSurveyName] = useState();
    const [survey, setSurvey] = useState(new Model(sixSurveyJson));

    // survey data
    const [sixSurveyData, setSixSurveyData] = useState();
    const [copdSurveyData, setCopdSurveyData] = useState(false);
    const [sgrSurveyData, setSGRSurveyData] = useState(false);
    const [borgScaleSurveyData, setBorgScaleSurveyData] = useState();

    // survey UI related!!
    survey.focusFirstQuestionAutomatic = false;
    survey.showNavigationButtons = false;
    survey.showCompletedPage = false;

    // survey METHODS
    const saveResults = (sender) => {
        const results = sender.data;

        console.log(sender.data);

        if (curSurveyName === '六分鐘呼吸測驗') {
            setSixSurveyData({ ...results, surveyCompleted: true });
        }
        if (curSurveyName === 'copd') {
            setCopdSurveyData({ ...results, surveyCompleted: true });
        }
        if (curSurveyName === 'sgr') {
            setSGRSurveyData({ ...results, surveyCompleted: true });
            console.log(sgrSurveyData);
        }
        if (curSurveyName === 'borgScale') {
            setBorgScaleSurveyData({ ...results, surveyCompleted: true });
        }
    };
    survey.onComplete.add(saveResults);

    const openSurveyModal = (surveyName) => {
        if (surveyName === '六分鐘呼吸測驗') {
            let survey = new Model(sixSurveyJson);

            // 1. 填入表單預設值
            // 2. 檢視問卷模式
            // *** TODO: // 之後改成:
            // ***       // 最後成績送出前 都可以進行問卷的修改
            // ***       // 並加上提示: 送出後，問卷答案便無法修改的字樣
            if (sixSurveyData) {
                survey.data = sixSurveyData;
                // survey.mode = 'display'; // 這個打開後，僅供檢視
            }
            setSurvey(survey);
        }
        if (surveyName === 'copd') {
            let survey = new Model(copdSurveyJson);

            if (copdSurveyData) {
                survey.data = copdSurveyData;
            }
            setSurvey(survey);
        }
        if (surveyName === 'sgr') {
            let survey = new Model(sgrSurveyJson);

            if (sgrSurveyData) {
                survey.data = sgrSurveyData;
            }
            setSurvey(survey);
        }
        if (surveyName === 'borgScale') {
            let survey = new Model(borgScaleSurveyJson);

            if (borgScaleSurveyData) {
                survey.data = borgScaleSurveyData;
            }
            setSurvey(survey);
        }

        setCurSurveyName(surveyName);
        setSurveyModalVisible(true);
    };

    const onOKSurvey = async () => {
        let error = survey.hasErrors();
        if (error) {
            return;
        }
        survey.doComplete();
        setSurveyModalVisible(false);
    };

    const onCancelSurvey = () => {
        setSurveyModalVisible(false);
    };

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

        console.log(user);
        // 初始化 填入問卷基本資料
        setSixSurveyData({
            question2: user?.name,
            question3: user?.idNumber,
            question5: moment(record?.beginWorkoutTime).format('L'),
            question9: user?.height + ' cm',
            question10: user?.weight + ' kg',
        });
        setSGRSurveyData({
            question1: {
                text1: user?.idNumber,
                text2: `${difficulty?.name} \n (目標${difficulty?.targetHeartRate}BPM／${difficulty?.targetWorkoutTime}分)`,
            },
            question2: moment(record?.beginWorkoutTime).format('L'),
        });
        setBorgScaleSurveyData({
            question2: `${difficulty?.name} \n (目標${difficulty?.targetHeartRate}BPM／${difficulty?.targetWorkoutTime}分)`,
        });
    };

    // 初始化 填入問卷基本資料
    // const initSurveyData = () => {
    //     console.log(record);
    //     console.log(user);
    //     console.log(difficulty);
    //     setSixSurveyData({
    //         question2: user?.name,
    //         question3: user?.idNumber,
    //         question5: moment(record?.beginWorkoutTime).format('L'),
    //     });
    //     setSGRSurveyData({
    //         question1: {
    //             text1: user?.idNumber,
    //             text2: `${difficulty?.name}\n(目標心率：${difficulty?.targetHeartRate}／目標騎乘時間：${difficulty?.targetWorkoutTime})`,
    //         },
    //         question2: moment(record?.beginWorkoutTime).format('L'),
    //     });
    // };

    const onFormSubmit = async (e) => {
        e.preventDefault();
        if (_.isEmpty(therapist)) {
            message.error('請填上治療師名稱');
            return;
        }

        if (_.isEmpty(safeHRIndex)) {
            message.error('請填上安全心律上線指數');
            return;
        }

        if (_.isEmpty(hrVariabilityIndex)) {
            message.error('請填上心律變異指數');
            return;
        }

        if (_.isEmpty(spo2)) {
            message.error('SPO2');
            return;
        }

        if (
            !(
                sixSurveyData?.surveyCompleted &&
                copdSurveyData?.surveyCompleted &&
                sgrSurveyData?.surveyCompleted &&
                borgScaleSurveyData?.surveyCompleted
            )
        ) {
            message.error('尚有問卷未完成');
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
            safeHRIndex: safeHRIndex,
            hrVariabilityIndex: hrVariabilityIndex,
            spo2: spo2,
            comment: comment,
            sixSurvey: sixSurveyData,
            borgScaleSurvey: borgScaleSurveyData,
            sgrSurvey: sgrSurveyData,
            copdSurvey: copdSurveyData,
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
                        <Descriptions.Item label="平均速率／平均心率">
                            20 BPM／30 RPM
                        </Descriptions.Item>
                        <Descriptions.Item label="運動強度">
                            23 WATTS
                        </Descriptions.Item>
                        <Descriptions.Item label="累積入熱量消耗">
                            12 CAL
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
                            <LineChart
                                {...configLineChart(
                                    packets,
                                    record.targetHeartRate,
                                )}
                            />
                        </Descriptions.Item>
                    </Descriptions>

                    <div className={styles.form}>
                        <h3>請完成以下評估問卷</h3>
                        <Space>
                            <Button
                                onClick={() =>
                                    openSurveyModal('六分鐘呼吸測驗')
                                }
                                type="primary"
                                icon={
                                    sixSurveyData?.surveyCompleted ? (
                                        <CheckOutlined />
                                    ) : null
                                }
                            >
                                進行 六分鐘呼吸測驗
                            </Button>
                            <Button
                                onClick={() => openSurveyModal('copd')}
                                type="primary"
                                icon={
                                    copdSurveyData?.surveyCompleted ? (
                                        <CheckOutlined />
                                    ) : null
                                }
                            >
                                進行 COPD 測驗
                            </Button>
                            <Button
                                onClick={() => openSurveyModal('sgr')}
                                type="primary"
                                icon={
                                    sgrSurveyData?.surveyCompleted ? (
                                        <CheckOutlined />
                                    ) : null
                                }
                            >
                                進行 SGR 測驗
                            </Button>
                            <Button
                                onClick={() => openSurveyModal('borgScale')}
                                type="primary"
                                icon={
                                    borgScaleSurveyData?.surveyCompleted ? (
                                        <CheckOutlined />
                                    ) : null
                                }
                            >
                                進行 Borg Scale 測驗
                            </Button>
                        </Space>
                    </div>
                    <div className={styles.form}>
                        <h3>請填寫以下資料，方可返回主選單</h3>

                        <Input
                            size="large"
                            placeholder="物理治療師名稱"
                            prefix={<UserOutlined />}
                            value={therapist}
                            onChange={(e) => {
                                setTherapist(e.target.value);
                            }}
                            required={true}
                        />
                        <Input
                            size="large"
                            placeholder="SPO2"
                            prefix={<EditOutlined />}
                            value={spo2}
                            onChange={(e) => {
                                setSpo2(e.target.value);
                            }}
                            style={{ marginTop: 16 }}
                            required={true}
                        />
                        <Input
                            size="large"
                            placeholder="安全心律上線指數"
                            prefix={<LineChartOutlined />}
                            value={safeHRIndex}
                            onChange={(e) => {
                                setSafeHRIndex(e.target.value);
                            }}
                            style={{ marginTop: 16 }}
                            required={true}
                        />
                        <Input
                            size="large"
                            placeholder="心律變異指數"
                            prefix={<LineChartOutlined />}
                            value={hrVariabilityIndex}
                            onChange={(e) => {
                                setHRVariabilityIndex(e.target.value);
                            }}
                            style={{ marginTop: 16 }}
                            required={true}
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
                <Modal
                    width={'70vw'}
                    className="surveyModalStyle" // 如果要覆寫 style 要這樣做
                    visible={surveyModalVisible}
                    onOk={onOKSurvey}
                    onCancel={onCancelSurvey}
                    destroyOnClose
                    okText="送出儲存"
                >
                    <Survey id="surveyContainer" model={survey} />
                </Modal>
            </Content>
        </Layout>
    );
};

export default FinishedWorkout;
