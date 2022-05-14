/* eslint-disable no-unused-vars */
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
    getDocs,
} from 'firebase/firestore';
import {
    Statistic,
    Layout,
    Form,
    PageHeader,
    Input,
    Button,
    message,
    Modal,
    Select,
    Divider,
    Popover,
    Spin,
} from 'antd';
import {
    LoadingOutlined,
    ExclamationCircleOutlined,
    SettingOutlined,
    ArrowRightOutlined,
} from '@ant-design/icons';
import _ from '../../util/helper';

import { ROUTE_PATH, VALID_MIN } from '../../constants';
import styles from './styles.module.scss';

import {
    usersRef,
    difficultiesRef,
    recordsRef,
    generateValidPairId,
    validateInputPairId,
} from '../../services/firebase';
import wait from '../../util/wait';

const { Countdown } = Statistic;
const { Content } = Layout;
const { Option } = Select;

const initialPacket = {
    rpm: 0,
    time: 0,
    heartRate: 0,
};

let unsubscribe = null;

const PrepareWorkout = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [users, setUsers] = useState();
    const [difficulties, setDifficulties] = useState([]);
    const [isDone, setIsDone] = useState(false);

    const [selectedUser, setSelectedUser] = useState();
    const [selectedDiff, setSelectedDiff] = useState();

    const [isPairing, setIsPairing] = useState(false);

    const [targetgetRecordId, setTargetRecordId] = useState();

    const [pairId, setPairId] = useState(); // 產生的不重複配對碼
    const [isAppConnected, setIsAppConnected] = useState(false);
    const [pairDeadline, setPairDeadline] = useState();

    // for functionality testing
    const [inputPairId, setInputPairId] = useState(''); // 輸入的配對碼

    useEffect(() => {
        init();

        return () => {
            if (_.isFunction(unsubscribe)) unsubscribe();
        };
    }, []);

    const init = async () => {
        const users = await fetchUsers();
        const difficulties = await fetchDiffs();

        setUsers(users);
        setDifficulties(difficulties);
        setIsDone(true);
    };

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
                    message.success('配對成功，您可以前往監視畫面了！');
                }
            }
        });

        // going to listen doc change!
    }, [targetgetRecordId]);

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

    const fetchDiffs = async () => {
        const difficulties = [];
        const querySnapshot = await getDocs(difficultiesRef);
        querySnapshot.forEach((doc) => {
            difficulties.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        return difficulties;
    };

    const goDashboard = async () => {
        if (targetgetRecordId) {
            Modal.confirm({
                title: '即將離開！',
                icon: <ExclamationCircleOutlined />,
                content: '將刪除所選資訊',
                onOk: () => deleteRecord('leave'),
            });
        } else {
            navigate(ROUTE_PATH.admin_dashbaord);
        }
    };

    const goMonitoring = () => {
        navigate(`${ROUTE_PATH.monitoring_workout}/${targetgetRecordId}`, {
            replace: true,
        });
    };

    const confirmUserAndDiff = async () => {
        const valid = await form.validateFields();

        console.log(valid);

        Modal.confirm({
            title: '即將產生配對碼！',
            icon: <ExclamationCircleOutlined />,
            content: '資料一旦輸入將無法進行修改，請確認無誤！',
            onOk: () => createRecord(),
        });
    };

    const createRecord = async () => {
        if (selectedUser == null || selectedDiff == null) {
            return;
        }

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

        // initialize sub collection - packets
        await addDoc(
            collection(recordsRef, targetRecordRef.id, 'packets'),
            initialPacket,
        );

        setTargetRecordId(targetRecordRef.id);
        setPairId(pairId);

        // start a count-down
        const deadline = Date.now() + 1000 * 60 * VALID_MIN;
        setPairDeadline(deadline);

        message.info({ content: '配對碼已生成！請在時間內進行配對！' }, 5);

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

    const deleteRecord = async (leave = false) => {
        const targetRecordRef = doc(recordsRef, targetgetRecordId);
        await deleteDoc(targetRecordRef);
        if (leave) navigate(ROUTE_PATH.admin_dashbaord);
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
        message.warn('連結過期，請重新選擇！', 3);

        await wait(1000);
        await deleteRecord();
        setTargetRecordId(null);
        setPairId(null);
        setSelectedUser();
        setSelectedDiff();
        setPairDeadline(null);
        setInputPairId(null);
        form.resetFields();
    };

    const onUserChange = (value) => setSelectedUser(value);
    const onDiffChange = (value) => setSelectedDiff(value);

    const simulateAppCotent = (
        <div className={styles.pairing}>
            <Input.Search
                placeholder="手動輸入配對碼"
                allowClear
                value={inputPairId}
                onChange={(e) => setInputPairId(e.target.value)}
                onSearch={pairWithApp}
                disabled={isAppConnected}
                loading={isPairing}
            />
            {/* <Button onClick={pairWithApp} disabled={isAppConnected}>
                我要配對
            </Button> */}
        </div>
    );

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
                        className={styles.PageHeader}
                        title="準備騎乘！進行騎乘設定"
                        subTitle="選擇騎乘者及關卡資訊"
                        onBack={goDashboard}
                    />

                    <Form {...formLayout} form={form} style={{ marginTop: 36 }}>
                        <Form.Item
                            name="user"
                            label="騎乘者"
                            rules={[
                                {
                                    required: true,
                                    message: '請選擇騎乘者',
                                },
                            ]}
                        >
                            <Select
                                placeholder="選擇騎乘者"
                                onChange={onUserChange}
                                disabled={pairId}
                            >
                                {users.map((user) => (
                                    <Option value={user.id} key={user.id}>
                                        {user.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="difficulty"
                            label="關卡資訊"
                            rules={[
                                {
                                    required: true,
                                    message: '請選擇關卡資訊',
                                },
                            ]}
                        >
                            <Select
                                placeholder="選擇關卡資訊"
                                onChange={onDiffChange}
                                disabled={pairId}
                            >
                                {difficulties.map((diff) => (
                                    <Option value={diff.id} key={diff.id}>
                                        {diff.name}・{diff.targetWorkoutTime}{' '}
                                        分鐘・目標 {diff.targetHeartRate} BPM
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item {...tailLayout}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                onClick={confirmUserAndDiff}
                                disabled={pairId}
                            >
                                下一步，生成配對碼
                            </Button>
                        </Form.Item>
                    </Form>

                    {pairId && (
                        <>
                            <Divider
                                dashed={true}
                                style={{
                                    minWidth: '90%',
                                    width: '90%',
                                    borderWidth: '2px',
                                    margin: 'auto',
                                    marginRight: 'auto',
                                    marginTop: '4em',
                                    marginBottom: '4em',
                                }}
                            />
                            <Form {...formLayout}>
                                <Form.Item
                                    label={
                                        <>
                                            配對碼
                                            <Popover
                                                content={simulateAppCotent}
                                                placement="bottomRight"
                                                title="更多操作"
                                                trigger="click"
                                            >
                                                <SettingOutlined
                                                    width={'1em'}
                                                />
                                            </Popover>
                                        </>
                                    }
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div className={styles.pairIdWrapper}>
                                        {pairId.split('').map((c, i) => (
                                            <pre key={c + i}>{c}</pre>
                                        ))}

                                        {/* <Countdown
                                            title="有效時間"
                                            value={Date.now() + 1000 * 60 * 10}
                                            onFinish={onDeadlineExpired}
                                        /> */}
                                        {pairDeadline && (
                                            <Countdown
                                                title="有效時間"
                                                value={pairDeadline}
                                                onFinish={onDeadlineExpired}
                                            />
                                        )}
                                    </div>
                                </Form.Item>
                                {!isAppConnected && (
                                    <Form.Item
                                        label=" "
                                        colon={false}
                                        style={{ marginTop: '3em' }}
                                    >
                                        <Spin
                                            indicator={
                                                <LoadingOutlined
                                                    style={{
                                                        fontSize: 24,
                                                        marginRight: '1em',
                                                    }}
                                                    spin
                                                />
                                            }
                                        />
                                        等待配對中...
                                    </Form.Item>
                                )}

                                <Form.Item
                                    label=" "
                                    colon={false}
                                    style={{ marginTop: '5em' }}
                                >
                                    <Button
                                        onClick={goMonitoring}
                                        type={
                                            isAppConnected
                                                ? 'primary'
                                                : 'dashed'
                                        }
                                        disabled={!isAppConnected}
                                        icon={
                                            isAppConnected && (
                                                <ArrowRightOutlined />
                                            )
                                        }
                                        size="large"
                                    >
                                        前往監視畫面
                                    </Button>
                                </Form.Item>
                            </Form>
                        </>
                    )}
                </div>
            </Content>
        </Layout>
    );
};

const formLayout = {
    labelCol: {
        span: 8,
    },
    wrapperCol: {
        span: 10,
    },
};

const tailLayout = {
    wrapperCol: {
        offset: 8,
        span: 16,
    },
};

export default PrepareWorkout;
