/* eslint-disable react/display-name */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import {
    Layout,
    Form,
    PageHeader,
    Input,
    Button,
    message,
    Modal,
    Row,
    Col,
    Table,
    Space,
    Descriptions,
    InputNumber,
    Popover,
    Badge,
    Typography,
} from 'antd';
import {
    PlusOutlined,
    MoreOutlined,
    SearchOutlined,
    CloseCircleFilled,
    ExclamationCircleOutlined,
} from '@ant-design/icons';

import { ROUTE_PATH, WARN_THRESHOLD, WARN } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';

import { difficultiesRef } from '../../services/firebase';

const { Content } = Layout;
const { Text } = Typography;

const DifficulityList = () => {
    const navigate = useNavigate();
    const [difficulties, setDifficulties] = useState([]); // 全部難度
    const [filteredDiffs, setFilteredDiffs] = useState([]); // 過濾難度
    const searchBarRef = useRef();
    const [isDone, setIsDone] = useState(false);

    const [currDiff, setCurrDiff] = useState(); // used by: edit, view
    const [loading, setLoading] = useState(false); // Modal 中的 [OK] 按鈕 loading

    // 顯示各階段警示心率的值
    const [warnHRValues, setWarnHRValues] = useState([]);

    // forms
    const [searchForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [createForm] = Form.useForm();

    // modals
    const [createModalVisible, setCreateModalVisible] = useState();
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        await fetchDiffs();
        setIsDone(true);
    };

    const fetchDiffs = async () => {
        const difficulties = [];
        const querySnapshot = await getDocs(difficultiesRef);
        querySnapshot.forEach((doc) => {
            if (!doc.data()?.isDeleted) {
                difficulties.push({
                    ...doc.data(),
                    id: doc.id,
                });
            }
        });

        setDifficulties(difficulties);
        setFilteredDiffs(difficulties);
    };

    const onSearch = async () => {
        const values = await searchForm.validateFields();
        const filteredDiffs = difficulties.filter((d) =>
            d.name.includes(values.name),
        );

        searchBarRef.current.blur();

        setFilteredDiffs(filteredDiffs);
    };

    const onCreateDiff = async () => {
        try {
            const values = await createForm.validateFields();

            setLoading(true);
            await addDoc(difficultiesRef, {
                name: values.name,
                targetHeartRate: values.targetHeartRate,
                targetWorkoutTime: values.targetWorkoutTime,
                upperLimitHeartRate: values.upperLimitHeartRate,
            });

            await fetchDiffs();
            setLoading(false);
            closeAllModals();
            createForm.resetFields();

            message.success(`成功新增難度！`);
        } catch (e) {
            console.log(e);
        }
    };

    const onPatchDiff = async () => {
        try {
            const values = await editForm.validateFields();
            // if pass
            // [values] would be: {age: 12}

            setLoading(true);
            const currUserRef = doc(difficultiesRef, currDiff.id);
            await updateDoc(currUserRef, {
                // 名字不更新
                targetHeartRate: values.targetHeartRate,
                targetWorkoutTime: values.targetWorkoutTime,
                upperLimitHeartRate: values.upperLimitHeartRate,
            });

            await fetchDiffs();
            setLoading(false);
            closeAllModals();

            message.success(`成功更新難度！`);
        } catch (e) {
            console.log(e);
        }
    };

    const onDeleteDiff = (id) => {
        const theDiff = difficulties.find((d) => d.id === id);

        Modal.confirm({
            title: `確定要刪除難度：${theDiff.name}`,
            icon: <ExclamationCircleOutlined />,
            content: '刪除後，難度資料將無法返回。',
            okText: '刪除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => deleteDiff(id),
        });
    };

    const deleteDiff = async (id) => {
        const theDiffRef = doc(difficultiesRef, id);
        await updateDoc(theDiffRef, {
            isDeleted: true,
        });

        await fetchDiffs();

        message.info('難度已刪除。');
    };

    const openViewModal = (id) => {
        const currDiff = difficulties.find((d) => d.id === id);
        const warnHRValues = getExactThresholdValue(
            currDiff.upperLimitHeartRate,
        );

        setCurrDiff(currDiff);
        setWarnHRValues(warnHRValues);
        setViewModalVisible(true);
    };

    const openEditModal = (id) => {
        const currDiff = difficulties.find((d) => d.id === id);

        editForm.setFieldsValue({
            targetHeartRate: currDiff.targetHeartRate,
            targetWorkoutTime: currDiff.targetWorkoutTime,
            upperLimitHeartRate: currDiff.upperLimitHeartRate,
        });

        setCurrDiff(currDiff);
        setEditModalVisible(true);
    };

    const openCreateModal = () => {
        setCreateModalVisible(true);
    };

    const closeAllModals = () => {
        setViewModalVisible(false);
        setCreateModalVisible(false);
        setEditModalVisible(false);
    };

    const closeViewModal = () => {
        setCurrDiff();
        closeAllModals();
    };

    const closeCreateModal = () => {
        createForm.resetFields();
        closeAllModals();
    };

    const closeEditModal = () => {
        setCurrDiff();
        closeAllModals();
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const getExactThresholdValue = (upperLimitHeartRate) => {
        if (!_.isNumber(upperLimitHeartRate)) {
            return;
        }

        console.log(upperLimitHeartRate);

        const calBase = upperLimitHeartRate / 100;

        const overHigh = Math.ceil(calBase * WARN_THRESHOLD.High);
        const overMedium = Math.ceil(calBase * WARN_THRESHOLD.Medium);
        const overSlight = Math.ceil(calBase * WARN_THRESHOLD.Slight);

        return [overSlight, overMedium, overHigh];
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
                        title="訓練難度資訊列表"
                        subTitle="管理難度資訊"
                        onBack={goDashboard}
                        extra={[
                            <Button
                                key={1}
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openCreateModal}
                            >
                                新增難度
                            </Button>,
                        ]}
                    />
                    <Form
                        {...formLayout}
                        form={searchForm}
                        style={{ marginTop: 36 }}
                    >
                        <Row gutter={[16, 0]}>
                            <Col span={16}>
                                <Form.Item label="難度名稱" name="name">
                                    <Input
                                        placeholder="輸入難度名稱查詢"
                                        allowClear={{
                                            clearIcon: (
                                                <CloseCircleFilled
                                                    onClick={onSearch}
                                                    style={{
                                                        color: '#00000040',
                                                    }}
                                                />
                                            ),
                                        }}
                                        ref={searchBarRef}
                                    />
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
                        columns={columns(
                            openViewModal,
                            openEditModal,
                            onDeleteDiff,
                        )}
                        dataSource={filteredDiffs}
                        pagination={{ pageSize: 5 }}
                        style={{ marginLeft: 24, marginRight: 24 }}
                    />
                    <Modal
                        title="檢視難度"
                        visible={viewModalVisible}
                        onCancel={closeViewModal}
                        footer={null} // no [Ok], [Cancel] button
                        width={600}
                    >
                        <Descriptions
                            bordered
                            className={styles.descriptions}
                            size="middle"
                            column={2}
                        >
                            <Descriptions.Item label="難度名稱" span={1}>
                                {currDiff?.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="目標騎乘時間" span={1}>
                                {currDiff?.targetWorkoutTime} 分
                            </Descriptions.Item>
                            <Descriptions.Item label="目標心率數值" span={2}>
                                {currDiff?.targetHeartRate}
                            </Descriptions.Item>
                            <Descriptions.Item label="上限心率數值" span={2}>
                                {currDiff?.upperLimitHeartRate}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={
                                    <>
                                        警示心率門檻
                                        <br />
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: '0.8em' }}
                                        >
                                            依據上限心率數值計算
                                        </Text>
                                    </>
                                }
                                span={2}
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
                        </Descriptions>
                    </Modal>
                    {/* 新增 Modal */}
                    <Modal
                        title="新增難度"
                        visible={createModalVisible}
                        onOk={onCreateDiff}
                        confirmLoading={loading}
                        onCancel={closeCreateModal}
                        destroyOnClose
                    >
                        <Form
                            {...modalFormLayout}
                            form={createForm}
                            layout="horizontal"
                        >
                            <Form.Item
                                label="難度名稱"
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填難度名稱',
                                    },
                                ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                label="目標騎乘時間"
                                name="targetWorkoutTime"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填目標騎乘時間',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={200}
                                    addonAfter={'分'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="目標心率數值"
                                name="targetHeartRate"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填目標心率數值',
                                    },
                                ]}
                            >
                                <InputNumber min={1} max={200} />
                            </Form.Item>
                            <Form.Item
                                label="上限心率數值"
                                name="upperLimitHeartRate"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上限心率數值',
                                    },
                                ]}
                                tooltip="此數值用做計算分階警示心率"
                            >
                                <InputNumber min={1} max={200} />
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        title="編輯難度"
                        visible={editModalVisible}
                        onOk={onPatchDiff}
                        confirmLoading={loading}
                        onCancel={closeEditModal}
                        destroyOnClose
                    >
                        <Form
                            {...modalFormLayout}
                            form={editForm}
                            layout="horizontal"
                        >
                            <Form.Item label="難度名稱">
                                {currDiff?.name}
                            </Form.Item>
                            <Form.Item
                                label="目標騎乘時間"
                                name="targetWorkoutTime"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填目標騎乘時間',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    max={200}
                                    addonAfter={'分'}
                                />
                            </Form.Item>
                            <Form.Item
                                label="目標心率數值"
                                name="targetHeartRate"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填目標心率數值',
                                    },
                                ]}
                            >
                                <InputNumber min={1} max={200} />
                            </Form.Item>
                            <Form.Item
                                label="上限心率數值"
                                name="upperLimitHeartRate"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上限心率數值',
                                    },
                                ]}
                            >
                                <InputNumber min={1} max={200} />
                            </Form.Item>
                        </Form>
                    </Modal>
                </div>
            </Content>
        </Layout>
    );
};

const columns = (openViewModal, openEditModal, onDeleteDiff) => [
    {
        key: 'name',
        title: '難度名稱',
        dataIndex: 'name',
    },
    {
        key: 'targetWorkoutTime',
        title: '目標騎乘時間',
        dataIndex: 'targetWorkoutTime',
        sorter: {
            compare: (a, b) => a.targetWorkoutTime - b.targetWorkoutTime,
        },
        width: 200,
    },
    {
        key: 'targetHeartRate',
        title: '目標心率數值',
        dataIndex: 'targetHeartRate',
        sorter: {
            compare: (a, b) => a.targetHeartRate - b.targetHeartRate,
        },
        width: 200,
    },
    {
        key: 'upperLimitHeartRate',
        title: '上限心率數值',
        dataIndex: 'upperLimitHeartRate',
        sorter: {
            compare: (a, b) => a.upperLimitHeartRate - b.upperLimitHeartRate,
        },
        width: 200,
    },
    {
        key: 'id',
        title: ' ',
        dataIndex: 'id',
        align: 'center',
        render: (id) => {
            return (
                <Popover
                    content={
                        <Space direction="vertical" size="small">
                            <Button
                                type="link"
                                onClick={() => openViewModal(id)}
                            >
                                查看
                            </Button>
                            <Button
                                type="link"
                                onClick={() => openEditModal(id)}
                            >
                                編輯
                            </Button>
                            <Button
                                type="link"
                                danger
                                onClick={() => onDeleteDiff(id)}
                            >
                                刪除
                            </Button>
                        </Space>
                    }
                    trigger="click"
                    placement="left"
                >
                    <MoreOutlined rotate={90} style={{ fontSize: '20px' }} />
                </Popover>
            );
        },
        width: 150,
    },
];

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
        // span: 8,
        offset: 10,
    },
    wrapperCol: {
        span: 16,
    },
};

const modalFormLayout = {
    labelCol: {
        span: 6,
        offset: 2,
    },
    wrapperCol: {
        span: 14,
    },
};

export default DifficulityList;
