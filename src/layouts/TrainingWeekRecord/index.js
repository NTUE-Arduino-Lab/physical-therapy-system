/* eslint-disable react/display-name */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    getDoc,
    getDocs,
    updateDoc,
    doc,
    addDoc,
    query,
    where,
    collection,
} from 'firebase/firestore';
import {
    Layout,
    Form,
    PageHeader,
    Input,
    Button,
    message,
    Modal,
    Table,
    Space,
    Descriptions,
    Popover,
} from 'antd';
import {
    PlusOutlined,
    MoreOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';

import styles from './styles.module.scss';

import { usersRef } from '../../services/firebase';
import IconBack from '../../components/IconBack';
import IconCheck from '../../components/IconCheck';

const { Content } = Layout;

const TrainingWeekRecord = () => {
    const navigate = useNavigate();
    const params = useParams();
    const [user, setUser] = useState(); // 該會員資料
    const [records, setRecords] = useState([]); // 該會員全部的訓練週數資料
    const [isDone, setIsDone] = useState(false);

    const [currRecord, setCurrRecord] = useState(); // used by: edit, view
    const [loading, setLoading] = useState(false); // Modal 中的 [OK] 按鈕 loading

    // forms
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
        await fetchUser();
        await fetchRecords();
        setIsDone(true);
    };

    const fetchUser = async () => {
        const userPath = doc(usersRef, params.userId);

        const userSnapshot = await getDoc(userPath);
        const user = userSnapshot.data();

        setUser(user);
    };

    const fetchRecords = async () => {
        const recordsPath = collection(
            usersRef,
            params.userId,
            'trainingWeekRecords',
        );
        const q = query(recordsPath, where('isDeleted', '!=', true));

        const records = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            records.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        console.log(records);

        setRecords(records);
    };

    const onCreateUser = async () => {
        try {
            const values = await createForm.validateFields();

            console.log(values);

            setLoading(true);
            const recordsPath = collection(
                usersRef,
                params.userId,
                'trainingWeekRecords',
            );
            await addDoc(recordsPath, {
                weekNumber: values.weekNumber,
                content: values.content,
                isDeleted: false,
            });

            await fetchRecords();
            setLoading(false);
            closeAllModals();
            createForm.resetFields();

            // message.success(`成功新增週次紀錄！`);
        } catch (e) {
            console.log(e);
            setLoading(false);
            message.error(e?.message);
        }
    };

    const onPatchRecord = async () => {
        try {
            const values = await editForm.validateFields();

            setLoading(true);
            const currRecordPath = doc(
                usersRef,
                params.userId,
                'trainingWeekRecords',
                currRecord.id,
            );
            await updateDoc(currRecordPath, {
                content: values.content,
            });

            await fetchRecords();
            setLoading(false);
            closeAllModals();

            // message.success(`成功更新騎乘者！`);
        } catch (e) {
            console.log(e);
            setLoading(false);
        }
    };

    const onDeleteRecord = (id) => {
        const theRecord = records.find((u) => u.id === id);

        Modal.confirm({
            title: `確定要刪除週次：${theRecord.weekNumber}`,
            icon: <ExclamationCircleOutlined />,
            content: '刪除後，週次訓練資料將無法返回。',
            okText: '刪除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => deleteRecord(id),
        });
    };

    const deleteRecord = async (id) => {
        const currRecordPath = doc(
            usersRef,
            params.userId,
            'trainingWeekRecords',
            id,
        );
        await updateDoc(currRecordPath, {
            isDeleted: true,
        });

        await fetchRecords();

        // message.info('週次紀錄已刪除。');
    };

    const openViewModal = (id) => {
        const currRecord = records.find((u) => u.id === id);
        setCurrRecord(currRecord);
        setViewModalVisible(true);
    };

    const openEditModal = (id) => {
        const currRecord = records.find((u) => u.id === id);

        editForm.setFieldsValue({
            weekNumber: currRecord.weekNumber,
            content: currRecord.content,
        });

        setCurrRecord(currRecord);
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
        setCurrRecord();
        closeAllModals();
    };

    const closeCreateModal = () => {
        createForm.resetFields();
        closeAllModals();
    };

    const closeEditModal = () => {
        setCurrRecord();
        closeAllModals();
    };

    const goBack = () => {
        navigate(-1);
    };

    return (
        <Layout>
            <Content className={styles.antContent}>
                <div className={styles.backIcon} onClick={goBack}>
                    <IconBack />
                </div>
                <div className={styles.container}>
                    <PageHeader
                        title={`${user?.name}的訓練週數紀錄`}
                        // subTitle={`管理${user.name}的訓練週數紀錄`}
                        // onBack={goBack}
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
                                新增訓練週次紀錄
                            </Button>,
                        ]}
                        style={{ borderRadius: '20px' }}
                    />
                    <Table
                        columns={columns(
                            openViewModal,
                            openEditModal,
                            onDeleteRecord,
                        )}
                        dataSource={records}
                        pagination={{
                            pageSize: 5,
                            position: ['bottomCenter'],
                        }}
                        style={{ marginLeft: 24, marginRight: 24 }}
                        className={styles.table}
                    />
                    <Modal
                        // title="檢視週次紀錄"
                        visible={viewModalVisible}
                        onCancel={closeViewModal}
                        footer={null} // no [Ok], [Cancel] button
                        width="50vw"
                    >
                        <Descriptions
                            bordered
                            className={styles.descriptions}
                            size="middle"
                        >
                            <Descriptions.Item
                                label="週次"
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
                                {currRecord?.weekNumber}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="紀錄內容"
                                span={3}
                                labelStyle={{
                                    background: '#FCC976',
                                    borderBottomLeftRadius: '0.8rem',
                                }}
                            >
                                {currRecord?.content}
                            </Descriptions.Item>
                        </Descriptions>
                    </Modal>
                    {/* 新增 Modal */}
                    <Modal
                        visible={createModalVisible}
                        onOk={onCreateUser}
                        confirmLoading={loading}
                        onCancel={closeCreateModal}
                        destroyOnClose
                        width="50vw"
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
                                label="週次"
                                name="weekNumber"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上週次',
                                    },
                                ]}
                            >
                                <Input placeholder="輸入第幾週" />
                            </Form.Item>
                            <Form.Item
                                label="紀錄內容"
                                name="content"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填寫紀錄內容',
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    showCount
                                    placeholder="訓練情形、特殊狀況等等．．．"
                                    maxLength={300}
                                    autoSize={{ minRows: 5 }}
                                />
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        // title="編輯週次紀錄"
                        visible={editModalVisible}
                        onOk={onPatchRecord}
                        confirmLoading={loading}
                        onCancel={closeEditModal}
                        destroyOnClose
                        width="50vw"
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
                                    onClick={onPatchRecord}
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
                        >
                            <Form.Item label="週數">
                                {currRecord?.weekNumber}
                            </Form.Item>
                            <Form.Item label="紀錄內容" name="content">
                                <Input.TextArea
                                    showCount
                                    placeholder="訓練情形、特殊狀況等等．．．"
                                    maxLength={300}
                                    autoSize={{ minRows: 5 }}
                                />
                            </Form.Item>
                        </Form>
                    </Modal>
                </div>
            </Content>
        </Layout>
    );
};

const columns = (openViewModal, openEditModal, onDeleteUser) => [
    {
        key: 'weekNumber',
        title: '週次',
        dataIndex: 'weekNumber',
        width: 200,
    },
    {
        key: 'content',
        title: '紀錄內容',
        dataIndex: 'content',
        render: (content) => {
            if (content.length > 100) {
                return content.slice(0, 97) + '...';
            }
            return content;
        },
    },
    {
        key: 'id',
        title: '',
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
                                style={{ color: '#F39700' }}
                            >
                                查看週次紀錄
                            </Button>
                            <Button
                                type="link"
                                onClick={() => openEditModal(id)}
                                style={{ color: '#F39700' }}
                            >
                                編輯週次紀錄
                            </Button>
                            <Button
                                type="link"
                                danger
                                onClick={() => onDeleteUser(id)}
                                style={{ color: '#F39700' }}
                            >
                                刪除週次紀錄
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

const modalFormLayout = {
    labelCol: {
        span: 7,
        // offset: 2,
    },
    wrapperCol: {
        span: 14,
    },
};

export default TrainingWeekRecord;
