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
    query,
    where,
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
    Row,
    Col,
    Descriptions,
    Typography,
    Badge,
    Space,
    Radio,
    Checkbox,
    InputNumber,
} from 'antd';
import {
    LoadingOutlined,
    ExclamationCircleOutlined,
    SettingOutlined,
    ArrowRightOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import _ from '../../util/helper';

import { ROUTE_PATH, VALID_MIN, WARN_THRESHOLD, WARN } from '../../constants';
import styles from './styles.module.scss';

import {
    usersRef,
    difficultiesRef,
    recordsRef,
    generateValidPairId,
    validateInputPairId,
} from '../../services/firebase';
import wait from '../../util/wait';
import IconBack from '../../components/IconBack';
import IconCheck from '../../components/IconCheck';
import IconArrowDown from '../../components/IconArrowDown';
import IconPrepareWorkout from '../../components/IconPrepareWorkout';

const { Countdown } = Statistic;
const { Content } = Layout;
const { Option } = Select;
const { Text } = Typography;

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

    // store [id]
    const [selectedUser, setSelectedUser] = useState();
    const [selectedDiff, setSelectedDiff] = useState();

    // 選使用者、關卡
    const [selUserModVis, setSelUserModVis] = useState(false);
    const [selDiffModVis, setSelDiffModVis] = useState(false);

    // 提供查看[使用者], [關卡]所需資訊。store data object
    const [selectedUserData, setSelectedUserData] = useState();
    const [selectedDiffData, setSelectedDiffData] = useState();
    const [userModalVis, setUserModalVis] = useState(false);
    const [diffModalVis, setDiffModalVis] = useState(false);

    //
    // 顯示”當前關卡“各階段警示心率的值
    const [warnHRValues, setWarnHRValues] = useState([]);
    //
    //

    // 直接在這邊建立新使用者
    const [createForm] = Form.useForm();
    const [createModalVisible, setCreateModalVisible] = useState(false);

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
        const q = query(usersRef, where('isDeleted', '!=', true));

        const users = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            users.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        return users;
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
        // const valid = await form.validateFields();

        // console.log(valid);

        if (selectedUser == null || selectedDiff == null) {
            Modal.error({
                title: '有內容沒有完成...',
                content: '請填寫好騎乘者資訊以及關卡資訊',
            });
            return;
        }

        Modal.confirm({
            title: '即將產生配對碼！',
            icon: <ExclamationCircleOutlined />,
            content: '資料一旦輸入將無法進行修改，請確認無誤！',
            okText: '確定',
            cancelText: '取消',
            onOk: () => createRecord(),
        });
    };

    const createRecord = async () => {
        if (selectedUser == null || selectedDiff == null) {
            return;
        }

        const theDiff = difficulties.find((d) => d.id === selectedDiff);

        const targetHeartRate = theDiff.targetHeartRate; // careful the type
        const upperLimitHeartRate = theDiff.upperLimitHeartRate; // careful the type
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
        setSelectedDiffData();
        setSelectedUserData();
        form.resetFields();
    };

    const openUserModal = () => {
        const selectedUserData = users.find((u) => u.id === selectedUser);

        setUserModalVis(true);
        setSelectedUserData(selectedUserData);
    };
    const openDiffModal = () => {
        const selectedDiffData = difficulties.find(
            (d) => d.id === selectedDiff,
        );
        const warnHRValues = getExactThresholdValue(
            selectedDiffData.upperLimitHeartRate,
        );

        setDiffModalVis(true);
        setSelectedDiffData(selectedDiffData);
        setWarnHRValues(warnHRValues);
    };
    const closeUserModal = () => {
        setUserModalVis(false);
        // setSelectedUserData();
    };
    const closeDiffModal = () => {
        setDiffModalVis(false);
        // setSelectedDiffData();
    };

    const getExactThresholdValue = (upperLimitHeartRate) => {
        if (!_.isNumber(upperLimitHeartRate)) {
            return;
        }

        const calBase = upperLimitHeartRate / 100;

        const overHigh = Math.ceil(calBase * WARN_THRESHOLD.High);
        const overMedium = Math.ceil(calBase * WARN_THRESHOLD.Medium);
        const overSlight = Math.ceil(calBase * WARN_THRESHOLD.Slight);

        return [overSlight, overMedium, overHigh];
    };

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

    // 選使用者
    const openSelectUser = () => {
        if (pairId) {
            return;
        }
        setSelUserModVis(true);
    };
    const closeSelectUser = () => {
        setSelUserModVis(false);
    };

    const onSelectUser = (e) => {
        setSelectedUser(e.target.value);
    };

    const confirmSelectedUser = () => {
        const selectedUserData = users?.find((u) => u.id === selectedUser);
        setSelectedUserData(selectedUserData);
        closeSelectUser();
    };

    // 選關卡
    const openSelectDiff = () => {
        if (pairId) {
            return;
        }
        setSelDiffModVis(true);
    };

    const closeSelectDiff = () => {
        setSelDiffModVis(false);
    };

    const onSelectDiff = (e) => {
        setSelectedDiff(e.target.value);
    };

    const confirmSelectedDiff = () => {
        const selectedDiffData = [...difficulties]?.find(
            (d) => d.id === selectedDiff,
        );

        if (!selectedDiffData) {
            return;
        }

        selectedDiffData.displayName = `${selectedDiffData.name}・${selectedDiffData.targetWorkoutTime} 分鐘・目標 ${selectedDiffData.targetHeartRate} BPM`;

        const warnHRValues = getExactThresholdValue(
            selectedDiffData?.upperLimitHeartRate,
        );

        setSelectedDiffData(selectedDiffData);
        setWarnHRValues(warnHRValues);
        closeSelectDiff();
    };

    // 建立新使用者
    const closeCreateModal = () => {
        createForm.resetFields();
        setCreateModalVisible(false);
    };

    const openCreateModal = () => {
        setCreateModalVisible(true);
    };

    const onCreateUser = async () => {
        try {
            const values = await createForm.validateFields();

            await addDoc(usersRef, {
                name: values.name,
                idNumber: values.idNumber,
                height: values.height,
                weight: values.weight,
                exerciseHeartRate: values.exerciseHeartRate,
                exerciseResist: values.exerciseResist ?? null,
                exerciseSpeed: values.exerciseSpeed ?? null,
                medicine: values.medicine ?? false,
                note: values.note ?? null,
                isDeleted: false,
            });

            const users = await fetchUsers();
            createForm.resetFields();
            setUsers(users);
            closeCreateModal();

            message.info({
                content: '成功新增會員',
                top: 10,
                duration: 3,
                icon: (
                    <div style={{ width: '1em', height: '1em' }}>
                        <IconCheck />
                    </div>
                ),
            });
        } catch (e) {
            console.log(e);
            message.error(e?.message);
        }
    };

    if (!isDone) {
        return (
            <Layout>
                <Content className={styles.antContent}>
                    <div className={styles.container}>
                        <PageHeader
                            className={styles.PageHeader}
                            title="資料讀取中..."
                        />
                    </div>
                </Content>
            </Layout>
        );
    }

    return (
        <Layout>
            <Content className={styles.antContent}>
                <div className={styles.backIcon} onClick={goDashboard}>
                    <IconBack />
                </div>
                <div className={styles.container}>
                    <div
                        className={styles.hero}
                        style={{ display: pairId ? 'none' : 'block' }}
                    >
                        <IconPrepareWorkout />
                    </div>
                    <div className={styles.heroText}>準備騎乘!進行騎乘設定</div>
                    <Form {...formLayout} form={form} style={{ width: '100%' }}>
                        <Form.Item name="user" label="騎乘者">
                            <Row gutter={8}>
                                <Col span={18}>
                                    <div
                                        className={`${styles.inputGroup} ${
                                            selectedUserData?.name
                                                ? styles.active
                                                : ''
                                        } ${pairId ? styles.disalbed : ''}`}
                                        onClick={openSelectUser}
                                    >
                                        {selectedUserData?.name}
                                        <IconArrowDown />
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <Button
                                        disabled={!selectedUser}
                                        onClick={openUserModal}
                                        style={{ width: '100%' }}
                                    >
                                        騎乘者資訊
                                    </Button>
                                </Col>
                            </Row>
                        </Form.Item>
                        <Form.Item name="difficulty" label="關卡資訊">
                            <Row gutter={8}>
                                <Col span={18}>
                                    <div
                                        className={`${styles.inputGroup} ${
                                            selectedDiffData?.displayName
                                                ? styles.active
                                                : ''
                                        } ${pairId ? styles.disalbed : ''}`}
                                        onClick={openSelectDiff}
                                    >
                                        {selectedDiffData?.displayName}
                                        <IconArrowDown />
                                    </div>
                                </Col>
                                <Col span={6}>
                                    <Button
                                        disabled={!selectedDiff}
                                        onClick={openDiffModal}
                                        style={{ width: '100%' }}
                                    >
                                        關卡資訊
                                    </Button>
                                </Col>
                            </Row>
                        </Form.Item>
                        <Form.Item {...tailLayout}>
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                }}
                            >
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    onClick={confirmUserAndDiff}
                                    disabled={pairId}
                                    style={{
                                        borderRadius: '34px',
                                        background: pairId
                                            ? '#D9D9D9'
                                            : '#F39700',
                                        border: '0px',
                                        padding: '0em 2em',
                                        letterSpacing: '0.5em',
                                        color: '#fff',
                                        fontSize: '1.2em',
                                    }}
                                >
                                    下一步生成配對碼
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>

                    <Modal
                        title={
                            <span
                                style={{
                                    fontSize: '1.2em',
                                    fontWeight: 'bold',
                                }}
                            >
                                選擇關卡
                            </span>
                        }
                        visible={selDiffModVis}
                        onCancel={closeSelectDiff}
                        footer={
                            <div>
                                <Button
                                    type="primary"
                                    style={{
                                        borderRadius: '34px',
                                        background: '#fff',
                                        border: '1px solid #F39700',
                                        color: '#000',
                                        padding: '0em 2em',
                                    }}
                                    onClick={closeSelectDiff}
                                >
                                    取消
                                </Button>
                                <Button
                                    type="primary"
                                    style={{
                                        borderRadius: '34px',
                                        background: '#F39700',
                                        border: '0px',
                                        padding: '0em 2em',
                                    }}
                                    onClick={confirmSelectedDiff}
                                >
                                    確定
                                </Button>
                            </div>
                        }
                    >
                        <Space
                            direction="vertical"
                            style={{
                                paddingLeft: '15px',
                                maxHeight: '40vh',
                                overflowY: 'scroll',
                                width: '100%',
                            }}
                        >
                            {[...difficulties].map((diff) => (
                                <Radio
                                    value={diff.id}
                                    key={diff.id}
                                    checked={diff.id === selectedDiff}
                                    onChange={onSelectDiff}
                                >
                                    {diff.name}・{diff.targetWorkoutTime}{' '}
                                    分鐘・目標 {diff.targetHeartRate} BPM
                                </Radio>
                            ))}
                        </Space>
                    </Modal>
                    <Modal
                        title={
                            <span
                                style={{
                                    fontSize: '1.2em',
                                    fontWeight: 'bold',
                                }}
                            >
                                選擇騎乘者
                            </span>
                        }
                        visible={selUserModVis}
                        onCancel={closeSelectUser}
                        footer={
                            <div>
                                <Button
                                    type="primary"
                                    style={{
                                        borderRadius: '34px',
                                        background: '#fff',
                                        border: '1px solid #F39700',
                                        color: '#000',
                                        padding: '0em 2em',
                                    }}
                                    onClick={closeSelectUser}
                                >
                                    取消
                                </Button>
                                <Button
                                    type="primary"
                                    style={{
                                        borderRadius: '34px',
                                        background: '#F39700',
                                        border: '0px',
                                        padding: '0em 2em',
                                    }}
                                    onClick={confirmSelectedUser}
                                >
                                    確定
                                </Button>
                            </div>
                        }
                    >
                        <Button
                            type="link"
                            icon={<PlusOutlined />}
                            style={{
                                color: '#F39700',
                                fontSize: 'bold',
                            }}
                            onClick={openCreateModal}
                        >
                            新增騎乘者
                        </Button>
                        <Divider style={{ margin: '1em' }} />
                        <Space
                            direction="vertical"
                            style={{
                                paddingLeft: '15px',
                                maxHeight: '40vh',
                                overflowY: 'scroll',
                                width: '100%',
                            }}
                        >
                            {users.map((user) => (
                                <Radio
                                    size="large"
                                    value={user.id}
                                    key={user.id}
                                    checked={user.id === selectedUser}
                                    onChange={onSelectUser}
                                >
                                    {user.name}
                                </Radio>
                            ))}
                        </Space>
                    </Modal>
                    <Modal
                        title={
                            <span
                                style={{
                                    fontSize: '1.2em',
                                    fontWeight: 'bold',
                                }}
                            >
                                新增會員
                            </span>
                        }
                        visible={createModalVisible}
                        onOk={onCreateUser}
                        onCancel={closeCreateModal}
                        destroyOnClose
                        footer={
                            <div>
                                <Button
                                    type="primary"
                                    style={{
                                        borderRadius: '34px',
                                        background: '#fff',
                                        border: '1px solid #F39700',
                                        color: '#000',
                                        padding: '0em 2em',
                                    }}
                                    onClick={closeCreateModal}
                                >
                                    取消
                                </Button>
                                <Button
                                    type="primary"
                                    style={{
                                        borderRadius: '34px',
                                        background: '#F39700',
                                        border: '0px',
                                        padding: '0em 2em',
                                    }}
                                    onClick={onCreateUser}
                                >
                                    確定
                                </Button>
                            </div>
                        }
                    >
                        <Form
                            {...modalFormLayout}
                            form={createForm}
                            layout="horizontal"
                        >
                            <Form.Item
                                label="會員編號"
                                name="idNumber"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員編號',
                                    },
                                ]}
                            >
                                <Input placeholder="會員編號為身分證字號" />
                            </Form.Item>
                            <Form.Item
                                label="姓名"
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上姓名',
                                    },
                                ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                label="身高"
                                name="height"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員身高',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={250}
                                    addonAfter={'公分'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="體重"
                                name="weight"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員體重',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={250}
                                    addonAfter={'公斤'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="運動心率"
                                name="exerciseHeartRate"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上會員運動心率',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={250}
                                    addonAfter={'BPM'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="運動阻力"
                                name="exerciseResist"
                                // rules={[
                                //     {
                                //         required: true,
                                //         message: '請填上姓名',
                                //     },
                                // ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                label="運動速度"
                                name="exerciseSpeed"
                                // rules={[
                                //     {
                                //         required: true,
                                //         message: '請填上姓名',
                                //     },
                                // ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                name="medicine"
                                label="是否服用治療藥物"
                                valuePropName="checked"
                            >
                                <Checkbox>
                                    <Text type="secondary">
                                        （有服用請打勾）
                                    </Text>
                                </Checkbox>
                            </Form.Item>
                            <Form.Item label="備註" name="note">
                                <Input.TextArea
                                    showCount
                                    placeholder="治療藥物註記、其他需留意之處．．．"
                                    maxLength={50}
                                    autoSize={{ minRows: 3, maxRows: 5 }}
                                />
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        title="檢視騎乘者"
                        visible={userModalVis}
                        onCancel={closeUserModal}
                        footer={null} // no [Ok], [Cancel] button
                    >
                        <Descriptions
                            bordered
                            className={styles.descriptions}
                            size="middle"
                        >
                            <Descriptions.Item
                                label="會員編號"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderTopLeftRadius: '0.8rem',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedUserData?.idNumber}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="姓名"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedUserData?.name}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="身高"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedUserData?.height} 公分
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="體重"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedUserData?.weight} 公斤
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="運動心率"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedUserData?.exerciseHeartRate} BPM
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="運動阻力"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedUserData?.exerciseResist}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="運動速度"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedUserData?.exerciseSpeed}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="是否服用藥物"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedUserData?.medicine ? '是' : '否'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="備註"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottomLeftRadius: '0.8rem',
                                }}
                            >
                                {selectedUserData?.note}
                            </Descriptions.Item>
                        </Descriptions>
                    </Modal>
                    <Modal
                        title="檢視難度"
                        visible={diffModalVis}
                        onCancel={closeDiffModal}
                        footer={null} // no [Ok], [Cancel] button
                        width={600}
                    >
                        <Descriptions
                            bordered
                            className={styles.descriptions}
                            size="middle"
                            column={2}
                        >
                            <Descriptions.Item
                                label="難度名稱"
                                span={1}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderTopLeftRadius: '0.8rem',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedDiffData?.name}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="目標騎乘時間"
                                span={1}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedDiffData?.targetWorkoutTime} 分
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="目標心率數值"
                                span={2}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedDiffData?.targetHeartRate}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="上限心率數值"
                                span={2}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                {selectedDiffData?.upperLimitHeartRate}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={
                                    <>
                                        警示心率門檻
                                        <br />
                                        <Text
                                            type="secondary"
                                            style={{
                                                fontSize: '0.8em',
                                            }}
                                        >
                                            依據上限心率數值計算
                                        </Text>
                                    </>
                                }
                                span={2}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                                contentStyle={{
                                    borderBottom: '1px solid rgb(243, 151, 0)',
                                }}
                            >
                                <Badge
                                    color="blue"
                                    text={WarnHRValueDisplay(
                                        warnHRValues?.[0],
                                        WARN.Slight,
                                    )}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                />

                                <Badge
                                    color="gold"
                                    text={WarnHRValueDisplay(
                                        warnHRValues?.[1],
                                        WARN.Medium,
                                    )}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                />

                                <Badge
                                    color="volcano"
                                    text={WarnHRValueDisplay(
                                        warnHRValues?.[2],
                                        WARN.High,
                                    )}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                />
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="備註"
                                span={2}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottomLeftRadius: '0.8rem',
                                }}
                            >
                                {selectedDiffData?.note}
                            </Descriptions.Item>
                        </Descriptions>
                    </Modal>

                    {pairId && (
                        <>
                            <Form
                                {...formLayout}
                                className={styles.pairInfoGroup}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span
                                        className={styles.pairLabel}
                                        style={{
                                            color: isAppConnected
                                                ? '#D9D9D9'
                                                : '#000',
                                        }}
                                    >
                                        配對碼
                                    </span>
                                    <Popover
                                        content={simulateAppCotent}
                                        placement="right"
                                        title="更多操作"
                                        trigger={isAppConnected ? [] : 'click'}
                                        disabled={isAppConnected}
                                    >
                                        <SettingOutlined
                                            width={'1em'}
                                            style={{
                                                color: isAppConnected
                                                    ? '#D9D9D9'
                                                    : '#000',
                                            }}
                                        />
                                    </Popover>
                                </div>

                                <div className={styles.pairIdWrapper}>
                                    {pairId.split('').map((c, i) => (
                                        <pre
                                            key={c + i}
                                            style={{
                                                color: isAppConnected
                                                    ? '#D9D9D9'
                                                    : '#F39700',
                                            }}
                                        >
                                            {c}
                                        </pre>
                                    ))}
                                </div>
                                {pairDeadline && (
                                    <Countdown
                                        title="有效時間"
                                        value={pairDeadline}
                                        onFinish={onDeadlineExpired}
                                    />
                                )}
                                {!isAppConnected && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                        }}
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
                                    </div>
                                )}

                                <Button
                                    onClick={goMonitoring}
                                    disabled={!isAppConnected}
                                    size="large"
                                    style={{
                                        borderRadius: '34px',
                                        background: isAppConnected
                                            ? '#F39700'
                                            : '#D9D9D9',
                                        color: '#fff',
                                        padding: '0em 3em',
                                        letterSpacing: '0.2em',
                                    }}
                                >
                                    前往監視畫面
                                </Button>
                            </Form>
                        </>
                    )}
                </div>
            </Content>
        </Layout>
    );
};

const WarnHRValueDisplay = (value, warn) => {
    let phase;
    let overVal;
    if (warn === WARN.Slight) {
        phase = '一';
        overVal = WARN_THRESHOLD.Slight - 100;
    }
    if (warn === WARN.Medium) {
        phase = '二';
        overVal = WARN_THRESHOLD.Medium - 100;
    }
    if (warn === WARN.High) {
        phase = '三';
        overVal = WARN_THRESHOLD.High - 100;
    }

    return (
        <div style={{ display: 'flex' }}>
            第{phase}階段：{value}
            <Text type="secondary" style={{ fontSize: '0.85em' }}>
                （超出 {overVal}％）
            </Text>
        </div>
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
        span: 8,
    },
};

const modalFormLayout = {
    labelCol: {
        span: 8,
        // offset:,
    },
    wrapperCol: {
        span: 16,
    },
};

export default PrepareWorkout;
