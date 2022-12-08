/* eslint-disable react/display-name */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getDocs,
    updateDoc,
    doc,
    addDoc,
    query,
    where,
} from 'firebase/firestore';
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
import IconBack from '../../components/IconBack';
import IconCheck from '../../components/IconCheck';
import IconView from '../../components/IconView';
import IconEdit from '../../components/IconEdit';
import IconDelete from '../../components/IconDelete';

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

    // forms changed
    // 監聽上限數值變化，返回三階段警示心率
    const [createFormChange, setCreateFormChange] = useState();
    const [editFormChange, setEditFormChange] = useState();

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
        const q = query(difficultiesRef, where('isDeleted', '!=', true));

        const difficulties = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            difficulties.push({
                ...doc.data(),
                id: doc.id,
            });
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
                note: values.note ?? null,
                isDeleted: false,
            });

            await fetchDiffs();
            setLoading(false);
            closeAllModals();
            createForm.resetFields();

            message.success(`成功新增難度！`);
        } catch (e) {
            console.log(e);
            setLoading(false);
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
                note: values.note,
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

        // message.info('難度已刪除。');
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
            note: currDiff.note,
        });

        setCurrDiff(currDiff);
        setEditFormChange(currDiff);
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
        setCreateFormChange();
        closeAllModals();
    };

    const closeEditModal = () => {
        setCurrDiff();
        setEditFormChange();
        closeAllModals();
    };

    const onFormValueChange = (changedVal, allVal, formKey) => {
        if (formKey === 'create') setCreateFormChange(allVal);
        if (formKey === 'edit') setEditFormChange(allVal);
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
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

    // if (!isDone) {
    //     return (
    //         <Layout style={{ padding: '24px' }}>
    //             <div className={styles.container}>
    //                 <PageHeader
    //                     className={styles.PageHeader}
    //                     title="資料讀取中..."
    //                 />
    //             </div>
    //         </Layout>
    //     );
    // }

    return (
        <Layout>
            <Content className={styles.antContent}>
                <div className={styles.backIcon} onClick={goDashboard}>
                    <IconBack />
                </div>
                <div className={styles.container}>
                    <PageHeader
                        title="訓練難度資訊列表"
                        subTitle={
                            <span
                                style={{ color: '#797878', fontWeight: 'bold' }}
                            >
                                管理難度資訊
                            </span>
                        }
                        // onBack={goDashboard}
                        extra={[
                            <Button
                                key={1}
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openCreateModal}
                                style={{
                                    borderRadius: '34px',
                                    background: '#F39700',
                                    border: '0px',
                                }}
                            >
                                新增難度
                            </Button>,
                        ]}
                        style={{ borderRadius: '20px' }}
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
                                        style={{
                                            border: '1px solid #F39700',
                                            background: '#FCC976',
                                        }}
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
                        pagination={{
                            pageSize: 3,
                            position: ['bottomCenter'],
                        }}
                        style={{ marginLeft: 24, marginRight: 24 }}
                        className={styles.table}
                    />
                    <Modal
                        title={
                            <span
                                style={{
                                    fontSize: '1.2em',
                                    fontWeight: 'bold',
                                }}
                            >
                                關卡資訊
                            </span>
                        }
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
                                {currDiff?.name}
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
                                {currDiff?.targetWorkoutTime} 分
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
                                {currDiff?.targetHeartRate}
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
                                {currDiff?.note}
                            </Descriptions.Item>
                        </Descriptions>
                    </Modal>
                    {/* 新增 Modal */}
                    <Modal
                        title={
                            <span
                                style={{
                                    fontSize: '1.2em',
                                    fontWeight: 'bold',
                                }}
                            >
                                新增難度
                            </span>
                        }
                        visible={createModalVisible}
                        onOk={onCreateDiff}
                        confirmLoading={loading}
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
                                    onClick={onCreateDiff}
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
                            onValuesChange={(changedVal, allVal) =>
                                onFormValueChange(changedVal, allVal, 'create')
                            }
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
                                <InputNumber
                                    min={1}
                                    max={200}
                                    addonAfter={'BPM'}
                                />
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
                                <InputNumber
                                    min={1}
                                    max={200}
                                    addonAfter={'BPM'}
                                />
                            </Form.Item>
                            <Form.Item label=" " colon={false}>
                                <Badge
                                    color="blue"
                                    text={WarnHRValueDisplay(
                                        getExactThresholdValue(
                                            createFormChange?.upperLimitHeartRate,
                                        )?.[0],
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
                                        getExactThresholdValue(
                                            createFormChange?.upperLimitHeartRate,
                                        )?.[1],
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
                                        getExactThresholdValue(
                                            createFormChange?.upperLimitHeartRate,
                                        )?.[2],
                                        WARN.High,
                                    )}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                />
                            </Form.Item>
                            <Form.Item label="備註" name="note">
                                <Input.TextArea
                                    showCount
                                    placeholder="需調整阻力值至多少、騎乘時的其他建議．．．"
                                    maxLength={50}
                                    autoSize={{ minRows: 3, maxRows: 5 }}
                                />
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        title={
                            <span
                                style={{
                                    fontSize: '1.2em',
                                    fontWeight: 'bold',
                                }}
                            >
                                編輯難度
                            </span>
                        }
                        visible={editModalVisible}
                        onOk={onPatchDiff}
                        confirmLoading={loading}
                        onCancel={closeEditModal}
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
                                    onClick={closeEditModal}
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
                                    onClick={onPatchDiff}
                                >
                                    確定
                                </Button>
                            </div>
                        }
                    >
                        <Form
                            {...modalFormLayout}
                            form={editForm}
                            layout="horizontal"
                            onValuesChange={(changedVal, allVal) =>
                                onFormValueChange(changedVal, allVal, 'edit')
                            }
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
                                <InputNumber
                                    min={1}
                                    max={200}
                                    addonAfter={'BPM'}
                                />
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
                                <InputNumber
                                    min={1}
                                    max={200}
                                    addonAfter={'BPM'}
                                />
                            </Form.Item>
                            <Form.Item label=" " colon={false}>
                                <Badge
                                    color="blue"
                                    text={WarnHRValueDisplay(
                                        getExactThresholdValue(
                                            editFormChange?.upperLimitHeartRate,
                                        )?.[0],
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
                                        getExactThresholdValue(
                                            editFormChange?.upperLimitHeartRate,
                                        )?.[1],
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
                                        getExactThresholdValue(
                                            editFormChange?.upperLimitHeartRate,
                                        )?.[2],
                                        WARN.High,
                                    )}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                />
                            </Form.Item>
                            <Form.Item label="備註" name="note">
                                <Input.TextArea
                                    showCount
                                    placeholder="需調整阻力值至多少、騎乘時的其他建議．．．"
                                    maxLength={50}
                                    autoSize={{ minRows: 3, maxRows: 5 }}
                                />
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
                <Space direction="horizontal" size="middle">
                    <div
                        style={{ width: '1.5em', height: '1.5em' }}
                        onClick={() => openViewModal(id)}
                    >
                        <IconView />
                    </div>
                    <div
                        style={{ width: '1.5em', height: '1.5em' }}
                        onClick={() => openEditModal(id)}
                    >
                        <IconEdit />
                    </div>
                    <div
                        style={{ width: '1.5em', height: '1.5em' }}
                        onClick={() => onDeleteDiff(id)}
                    >
                        <IconDelete />
                    </div>
                    {/* <Button type="link" onClick={() => openViewModal(id)}>
                        查看
                    </Button>
                    <Button type="link" onClick={() => openEditModal(id)}>
                        編輯
                    </Button>
                    <Button type="link" danger onClick={() => onDeleteDiff(id)}>
                        刪除
                    </Button> */}
                </Space>
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
