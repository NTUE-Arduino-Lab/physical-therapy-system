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
} from 'antd';
import moment from 'moment';
import { DualAxes as LineChart } from '@ant-design/plots';
import { SearchOutlined, CrownOutlined } from '@ant-design/icons';
import _ from '../../util/helper';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { recordsRef, usersRef, difficultiesRef } from '../../services/firebase';
import formatWithMoment from '../../util/formatSeconds';
import configLineChart from '../../util/configLineChart';

const { Content } = Layout;
const { Option } = Select;

const RecordList = () => {
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
    const [users, setUsers] = useState(); // 把使用者資料灌回去 records 中
    const [difficulties, setDifficulties] = useState([]); // 把難度資料灌回去 records 中

    // forms
    const [searchForm] = Form.useForm();

    // modals
    const [viewModalVisible, setViewModalVisible] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const users = await fetchUsers();
        const records = await fetchRecords();
        const difficulties = await fetchDiffs();

        patchRecordsWithUserAndDiff({ users, records, difficulties });
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

    const patchRecordsWithUserAndDiff = ({ users, records, difficulties }) => {
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

        setReocrds(patchedRecords);
        setUsers(users);
        setDifficulties(difficulties);
        setIsDone(true);

        if (params.userId !== '123') {
            const filteredRecords = patchedRecords.filter(
                (r) => r.user === params.userId,
            );
            setFilteredReocrds(filteredRecords);
            searchForm.setFieldsValue({ user: params.userId });
        } else {
            setFilteredReocrds(patchedRecords);
        }
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

    const openViewModal = async (id) => {
        setViewModalVisible(true);
        setLoading(true);

        const currRecord = records.find((r) => r.id === id);
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

        setCurrRecord(currRecord);
        setCurrRecordPackets(currReocrdPackets);

        setLoading(false);
    };

    const closeViewModal = () => {
        setCurrRecord();
        setCurrRecordPackets([]);
        setViewModalVisible(false);
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
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
            <Content className="site-layout" style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <PageHeader
                        title="騎乘紀錄列表"
                        subTitle="查看騎乘紀錄資訊"
                        onBack={goDashboard}
                    />
                    <Form
                        {...formLayout}
                        form={searchForm}
                        style={{ marginTop: 36 }}
                    >
                        <Row gutter={[16, 0]}>
                            <Col span={10}>
                                <Form.Item label="騎乘者名稱" name="user">
                                    <Select placeholder="選擇騎乘者" allowClear>
                                        {users.map((user) => (
                                            <Option
                                                value={user.id}
                                                key={user.id}
                                            >
                                                {user.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={10}>
                                <Form.Item label="騎乘關卡" name="difficulty">
                                    <Select
                                        placeholder="選擇關卡資訊"
                                        allowClear
                                    >
                                        {difficulties.map((diff) => (
                                            <Option
                                                value={diff.id}
                                                key={diff.id}
                                            >
                                                {diff.name}・
                                                {diff.targetWorkoutTime}{' '}
                                                分鐘・目標{' '}
                                                {diff.targetHeartRate} BPM
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        onClick={onSearch}
                                        icon={<SearchOutlined />}
                                    >
                                        查詢
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                    <Table
                        columns={columns(openViewModal)}
                        dataSource={filteredRecords}
                        pagination={{ pageSize: 5 }}
                        style={{ marginLeft: 24, marginRight: 24 }}
                    />
                    <Modal
                        title="檢視紀錄"
                        visible={viewModalVisible}
                        onCancel={closeViewModal}
                        footer={null} // no [Ok], [Cancel] button
                        width={'90vw'}
                    >
                        {loading ? (
                            '資料讀取中...'
                        ) : (
                            <>
                                <Descriptions
                                    bordered
                                    className={styles.descriptions}
                                >
                                    <Descriptions.Item
                                        label="騎乘者姓名"
                                        span={2}
                                    >
                                        {currRecord?.userData?.name}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label="騎乘者會員編號"
                                        span={2}
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
                                    >
                                        {calWorkoutTime(currRecord)}／
                                        {
                                            currRecord?.difficultyData
                                                ?.targetWorkoutTime
                                        }{' '}
                                        分
                                    </Descriptions.Item>
                                    <Descriptions.Item label="開始騎乘時間">
                                        {currRecord?.beginWorkoutTime.toLocaleString()}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="結束騎乘時間">
                                        {currRecord?.finishedWorkoutTime.toLocaleString()}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="騎乘關卡">
                                        {currRecord?.difficultyData?.name}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="目標心率">
                                        {
                                            currRecord?.difficultyData
                                                ?.targetHeartRate
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item label="上限心率">
                                        {
                                            currRecord?.difficultyData
                                                ?.upperLimitHeartRate
                                        }
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label="RPM＆心率統計圖"
                                        span={3}
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
                                    >
                                        {currRecord?.therapist}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label="安全心律上線指數"
                                        span={3}
                                    >
                                        {currRecord?.safeHRIndex}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label="心律變異指數"
                                        span={3}
                                    >
                                        {currRecord?.hrVariabilityIndex}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label="治療結果評語"
                                        span={3}
                                    >
                                        {currRecord?.comment}
                                    </Descriptions.Item>
                                </Descriptions>
                            </>
                        )}
                    </Modal>
                </div>
            </Content>
        </Layout>
    );
};

const columns = (openViewModal) => [
    {
        key: 'id',
        title: '紀錄ID',
        dataIndex: 'id',
        width: 100,
        render: (id) => `${id.slice(0, 5)}....`,
    },
    {
        key: 'isGT30',
        title: '長途騎乘',
        width: 100,
        render: (currRecord) => {
            if (isWorkoutTimeGT30(currRecord)) {
                return (
                    <CrownOutlined
                        style={{
                            fontSize: '1.5em',
                            color: '#fb8b24',
                        }}
                    />
                );
            } else {
                return ' ';
            }
        },
        align: 'center',
    },
    {
        key: 'userData',
        title: '騎乘者姓名',
        dataIndex: 'userData',
        width: 200,
        render: (userData) => userData?.name,
    },
    {
        key: 'difficulty',
        title: '騎乘關卡',
        dataIndex: 'difficultyData',
        width: 200,
        render: (difficultyData) => difficultyData?.name,
    },
    {
        key: 'difficulty',
        title: '騎乘開始時間',
        dataIndex: 'beginWorkoutTime',
        width: 200,
        render: (beginWorkoutTime) => beginWorkoutTime.toLocaleString(),
    },
    {
        key: 'beginWorkoutTime',
        title: '騎乘時間',
        width: 200,
        render: (currRecord) => calWorkoutTime(currRecord),
    },
    {
        key: 'id',
        title: ' ',
        dataIndex: 'id',
        align: 'center',
        render: (id) => (
            <Button type="link" onClick={() => openViewModal(id)}>
                查看
            </Button>
        ),
        width: 150,
    },
];

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

const formLayout = {
    labelCol: {
        // span: 8,
        offset: 2,
    },
    wrapperCol: {
        span: 16,
    },
};

export default RecordList;
