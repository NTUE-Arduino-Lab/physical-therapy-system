/* eslint-disable react/display-name */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocs, collection, query, where } from 'firebase/firestore';
import {
    Layout,
    Form,
    PageHeader,
    Button,
    Modal,
    Row,
    Col,
    Table,
    Descriptions,
    Select,
    Space,
} from 'antd';
import moment from 'moment';
import { DualAxes as LineChart } from '@ant-design/plots';
import {
    SearchOutlined,
    CrownOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import _ from '../../util/helper';
import { StylesManager, Model } from 'survey-core';
import { Survey } from 'survey-react-ui';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { recordsRef, usersRef, difficultiesRef } from '../../services/firebase';
import formatWithMoment from '../../util/formatSeconds';
import configLineChart from '../../util/configLineChart';
import IconBack from '../../components/IconBack';
import IconCheck from '../../components/IconCheck';

import SixMinutesTest from '../../components/SixMinutesTest';

import SixSurveyJson from '../../assets/surveys/sixSurvey.json';
import COPDSurveyJson from '../../assets/surveys/copdSurvey.json';
import SGRSurveyJson from '../../assets/surveys/sgrSurvey.json';
import BorgScaleSurveyJson from '../../assets/surveys/borgScaleSurvey.json';
import LungTherapyEvaSurveyJson from '../../assets/surveys/lungTherapyEvaSurvey.json';
import SixSurveyNewJson from '../../assets/surveys/6minSurvey.json';
import 'survey-core/defaultV2.css';
StylesManager.applyTheme('defaultV2');
const sixSurveyJson = SixSurveyJson;
const copdSurveyJson = COPDSurveyJson;
const sgrSurveyJson = SGRSurveyJson;
const borgScaleSurveyJson = BorgScaleSurveyJson;
const lungTherapyEvaSurveyJson = LungTherapyEvaSurveyJson;
const sixSurveyNewJson = SixSurveyNewJson;

const mySurveyCss = {
    text: {
        controlDisabled: 'survey-input-disabled',
    },
    rating: {
        selected: 'survey-rating-selected',
    },
};

const { Content } = Layout;
const { Option } = Select;

const RecordDetail = () => {
    const navigate = useNavigate();
    const params = useParams();

    const searchBarRef = useRef();
    const [isDone, setIsDone] = useState(false);
    const [loading, setLoading] = useState(false); // 等待抓取 packets 資料

    const [records, setReocrds] = useState([]);
    const [filteredRecords, setFilteredReocrds] = useState([]);
    const [currRecord, setCurrRecord] = useState();
    const [currReocrdPackets, setCurrRecordPackets] = useState();

    // patched Data
    const [users, setUsers] = useState([]); // 把使用者資料灌回去 records 中
    const [difficulties, setDifficulties] = useState([]); // 把難度資料灌回去 records 中

    // forms
    const [searchForm] = Form.useForm();

    // modals
    const [viewModalVisible, setViewModalVisible] = useState(false);

    // survey control
    const [surveyModalVisible, setSurveyModalVisible] = useState(false);
    const [curSurveyName, setCurSurveyName] = useState();
    const [survey, setSurvey] = useState(new Model(sixSurveyJson));

    // survey UI related!!
    survey.focusFirstQuestionAutomatic = false;
    survey.showNavigationButtons = false;
    survey.showCompletedPage = false;

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const users = await fetchUsers();
        const records = await fetchRecords();
        const difficulties = await fetchDiffs();

        patchRecordsWithUserAndDiffAndFindTarget({
            users,
            records,
            difficulties,
        });
        // 上面會接著找當下的 record!!!

        // await openViewModal(params.recordId);
        // setIsDone(true);
    };

    const fetchUsers = async () => {
        const users = [];
        const querySnapshot = await getDocs(usersRef);
        querySnapshot.forEach((doc) => {
            if (!doc.data()?.isDeleted) {
                users.push({
                    ...doc.data(),
                    id: doc.id,
                });
            }
        });

        return users;
    };

    const fetchRecords = async () => {
        const records = [];
        const querySnapshot = await getDocs(recordsRef);
        querySnapshot.forEach((doc) => {
            const recordData = doc.data();
            if (
                recordData.beginWorkoutTime != null &&
                recordData.finishedWorkoutTime != null
            ) {
                records.push({
                    ...recordData,
                    id: doc.id,
                    beginWorkoutTime: recordData.beginWorkoutTime.toDate(),
                    finishedWorkoutTime: recordData.finishedWorkoutTime.toDate(),
                });
            }
        });

        records.sort(
            (a, b) =>
                b.finishedWorkoutTime.getTime() -
                a.finishedWorkoutTime.getTime(),
        );

        return records;
    };

    const fetchDiffs = async () => {
        const q = query(difficultiesRef, where('isDeleted', '!=', true));

        const difficulties = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            difficulties.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        return difficulties;
    };

    const patchRecordsWithUserAndDiffAndFindTarget = async ({
        users,
        records,
        difficulties,
    }) => {
        // patch with key [userData]
        // patch with key [difficultyData]

        const patchedRecords = records.map((record) => {
            const userData = users.find((u) => u.id === record.user);
            const difficultyData = difficulties.find(
                (d) => d.id === record.difficulty,
            );

            return {
                ...record,
                userData,
                difficultyData,
            };
        });

        // 找當筆
        const id = params.recordId;
        const currRecord = patchedRecords.find((r) => r.id === id);
        const packetsRef = collection(recordsRef, id, 'packets');

        // packets
        const currReocrdPackets = [];
        const packetsSnapshot = await getDocs(packetsRef);
        packetsSnapshot.forEach((doc) => {
            currReocrdPackets.push({
                ...doc.data(),
                timeLabel: formatWithMoment(doc.data().time),
            });
        });

        currReocrdPackets.sort((a, b) => a.time - b.time);
        currReocrdPackets.splice(0, 1);

        setReocrds(patchedRecords);
        setUsers(users);
        setDifficulties(difficulties);
        setCurrRecord(currRecord);
        setCurrRecordPackets(currReocrdPackets);

        setIsDone(true);
    };

    const onSearch = async () => {
        const values = await searchForm.validateFields();

        let filteredRecords = records.filter((r) => {
            if (_.isEmpty(values.user) && _.isEmpty(values.difficulty)) {
                return true;
            }
            if (_.isNotEmpty(values.user) && _.isNotEmpty(values.difficulty)) {
                return (
                    r.user === values.user && r.difficulty === values.difficulty
                );
            }
            if (_.isNotEmpty(values.user) && _.isEmpty(values.difficulty)) {
                return r.user === values.user;
            }
            if (_.isNotEmpty(values.difficulty) && _.isEmpty(values.user)) {
                console.log('here');
                return r.difficulty === values.difficulty;
            }
        });

        setFilteredReocrds(filteredRecords);
    };

    const closeViewModal = () => {
        setCurrRecord();
        setCurrRecordPackets([]);
        setViewModalVisible(false);
    };

    const goBack = () => {
        navigate(`${ROUTE_PATH.record_list}/123`);
    };

    const openSurveyModal = (surveyName) => {
        if (surveyName === '六分鐘呼吸測驗') {
            let survey = new Model(sixSurveyJson);

            survey.data = currRecord.sixSurvey;
            survey.mode = 'display';

            setSurvey(survey);
        }
        if (surveyName === 'copd') {
            let survey = new Model(copdSurveyJson);

            survey.data = currRecord.copdSurvey;
            survey.mode = 'display';

            setSurvey(survey);
        }
        if (surveyName === 'sgr') {
            let survey = new Model(sgrSurveyJson);

            survey.data = currRecord.sgrSurvey;
            survey.mode = 'display';

            setSurvey(survey);
        }
        if (surveyName === 'borgScale') {
            let survey = new Model(borgScaleSurveyJson);

            survey.data = currRecord.borgScaleSurvey;
            survey.mode = 'display';

            setSurvey(survey);
        }
        if (surveyName === 'lungTherapyEva') {
            let survey = new Model(lungTherapyEvaSurveyJson);

            survey.data = currRecord.lungTherapyEva;
            survey.mode = 'display';

            setSurvey(survey);
        }
        if (surveyName === 'sixSurveyNew') {
            // let survey = new Model(sixSurveyNewJson);
            // survey.data = currRecord.sixSurveyNew;
            // survey.mode = 'display';
            // setSurvey(survey);
        }

        setCurSurveyName(surveyName);
        setSurveyModalVisible(true);
    };

    const onCancelSurvey = () => {
        setSurveyModalVisible(false);
    };

    if (!isDone) {
        return (
            <Layout style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <PageHeader
                        className={styles.PageHeader}
                        title="資料讀取中..."
                    />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Content className={styles.antContent}>
                <div className={styles.backIcon} onClick={goBack}>
                    <IconBack />
                </div>
                <h1>檢視紀錄</h1>

                <div className={styles.container}>
                    <>
                        <Descriptions bordered className={styles.descriptions}>
                            <Descriptions.Item
                                label="騎乘者姓名"
                                span={2}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderTopLeftRadius: '0.8rem',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {currRecord?.userData?.name}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="騎乘者會員編號"
                                span={2}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {currRecord?.userData?.idNumber}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={
                                    <div>
                                        實際騎乘時間
                                        <br />/ 目標騎乘時間
                                    </div>
                                }
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {calWorkoutTime(currRecord)}／
                                {currRecord?.difficultyData?.targetWorkoutTime}{' '}
                                分
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="開始騎乘時間"
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {currRecord?.beginWorkoutTime.toLocaleString()}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="結束騎乘時間"
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {currRecord?.finishedWorkoutTime.toLocaleString()}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="平均速率／平均心率"
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                20 BPM／30 RPM
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="運動強度"
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                23 WATTS
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="累積入熱量消耗"
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                12 CAL
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="騎乘關卡"
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {currRecord?.difficultyData?.name}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="目標心率"
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {currRecord?.difficultyData?.targetHeartRate}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="上限心率"
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {
                                    currRecord?.difficultyData
                                        ?.upperLimitHeartRate
                                }
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="RPM＆心率統計圖"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                <LineChart
                                    {...configLineChart(
                                        currReocrdPackets,
                                        currRecord?.targetHeartRate,
                                    )}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="物理治療師名稱"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {currRecord?.therapist}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="安全心律上線指數"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {currRecord?.safeHRIndex}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="心律變異指數"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {currRecord?.hrVariabilityIndex}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="治療結果評語"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottomLeftRadius: '0.8rem',
                                }}
                            >
                                {currRecord?.comment}
                            </Descriptions.Item>
                        </Descriptions>
                        <Space
                            style={{ marginTop: '24px', marginBottom: '24px' }}
                        >
                            {/* <Button
                                onClick={() =>
                                    openSurveyModal('六分鐘呼吸測驗')
                                }
                                type="primary"
                                style={{
                                    borderRadius: '34px',
                                    background: '#F39700',
                                    border: '0px',
                                }}
                            >
                                查看 六分鐘呼吸測驗結果
                            </Button> */}
                            <Button
                                onClick={() => openSurveyModal('copd')}
                                type="primary"
                                style={{
                                    borderRadius: '34px',
                                    background: '#F39700',
                                    border: '0px',
                                }}
                            >
                                查看 COPD 測驗結果
                            </Button>
                            <Button
                                onClick={() => openSurveyModal('sgr')}
                                type="primary"
                                style={{
                                    borderRadius: '34px',
                                    background: '#F39700',
                                    border: '0px',
                                }}
                            >
                                查看 SGR 測驗結果
                            </Button>
                            <Button
                                onClick={() => openSurveyModal('borgScale')}
                                type="primary"
                                style={{
                                    borderRadius: '34px',
                                    background: '#F39700',
                                    border: '0px',
                                }}
                            >
                                查看 Borg Scale 測驗結果
                            </Button>
                            <Button
                                onClick={() =>
                                    openSurveyModal('lungTherapyEva')
                                }
                                type="primary"
                                style={{
                                    borderRadius: '34px',
                                    background: '#F39700',
                                    border: '0px',
                                }}
                            >
                                查看 呼吸治療肺復原和呼吸訓練評估表結果
                            </Button>
                            <Button
                                onClick={() => openSurveyModal('sixSurveyNew')}
                                type="primary"
                                style={{
                                    borderRadius: '34px',
                                    background: '#F39700',
                                    border: '0px',
                                }}
                            >
                                查看 六分鐘呼吸測驗結果
                            </Button>
                        </Space>
                    </>
                    <Modal
                        width={
                            curSurveyName === 'sixSurveyNew' ? '90vw' : '70vw'
                        }
                        className="surveyModalStyle" // 如果要覆寫 style 要這樣做
                        visible={surveyModalVisible}
                        footer={null} // no [Ok], [Cancel] button
                        destroyOnClose
                        onCancel={onCancelSurvey}
                    >
                        {curSurveyName === 'sixSurveyNew' ? (
                            <SixMinutesTest
                                sixSurveyNewData={currRecord?.sixSurveyNew}
                                readOnly={true}
                            />
                        ) : (
                            <Survey
                                id="surveyContainer"
                                model={survey}
                                css={mySurveyCss}
                            />
                        )}
                    </Modal>
                </div>
            </Content>
        </Layout>
    );
};

const calWorkoutTime = (currRecord) => {
    if (_.isEmpty(currRecord)) {
        return;
    }
    const begin = moment(currRecord?.beginWorkoutTime);
    const end = moment(currRecord?.finishedWorkoutTime);

    const diff = moment.duration(end.diff(begin)).asMilliseconds();

    const h = ('0' + Math.floor(diff / 3600000)).slice(-2);
    const m = ('0' + Math.floor((diff / 60000) % 60)).slice(-2);
    const s = ('0' + Math.floor((diff / 1000) % 60)).slice(-2);

    let returnStr = '';

    if (h != '00') returnStr += `${h} 小時 `;
    returnStr += `${m} 分 ${s} 秒`;

    return returnStr;
};

const isWorkoutTimeGT30 = (currRecord) => {
    if (_.isEmpty(currRecord)) {
        return;
    }
    const begin = moment(currRecord?.beginWorkoutTime);
    const end = moment(currRecord?.finishedWorkoutTime);

    const diff = moment.duration(end.diff(begin)).asMilliseconds();

    const m = ('0' + Math.floor((diff / 60000) % 60)).slice(-2); // 分

    return parseInt(m) >= 30;
};

export default RecordDetail;
