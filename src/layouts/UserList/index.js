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
} from 'antd';
import {
    PlusOutlined,
    MoreOutlined,
    SearchOutlined,
    CloseCircleFilled,
    ExclamationCircleOutlined,
} from '@ant-design/icons';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { usersRef } from '../../services/firebase';

const { Content } = Layout;

const UserList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]); // 全部使用者資料
    const [filteredUser, setFilteredUser] = useState([]); // 過濾的使用者資料
    const searchBarRef = useRef();
    const [isDone, setIsDone] = useState(false);

    const [currUser, setCurrUser] = useState(); // used by: edit, view
    const [loading, setLoading] = useState(false); // Modal 中的 [OK] 按鈕 loading

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
        await fetchUsers();
        setIsDone(true);
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

        setUsers(users);
        setFilteredUser(users);
    };

    const onSearch = async () => {
        const values = await searchForm.validateFields();
        const filteredUser = users.filter((u) => u.name.includes(values.name));

        searchBarRef.current.blur();

        setFilteredUser(filteredUser);
    };

    const onCreateUser = async () => {
        try {
            const values = await createForm.validateFields();

            setLoading(true);
            await addDoc(usersRef, {
                name: values.name,
                age: values.age,
            });

            await fetchUsers();
            setLoading(false);
            closeAllModals();
            createForm.resetFields();

            message.success(`成功新增騎乘者！`);
        } catch (e) {
            console.log(e);
        }
    };

    const onPatchUser = async () => {
        try {
            const values = await editForm.validateFields();
            // if pass
            // [values] would be: {age: 12}

            setLoading(true);
            const currUserRef = doc(usersRef, currUser.id);
            await updateDoc(currUserRef, {
                age: values.age,
            });

            await fetchUsers();
            setLoading(false);
            closeAllModals();

            message.success(`成功更新騎乘者！`);
        } catch (e) {
            console.log(e);
        }
    };

    const onDeleteUser = (id) => {
        const theUser = users.find((u) => u.id === id);

        Modal.confirm({
            title: `確定要刪除騎乘者者：${theUser.name}`,
            icon: <ExclamationCircleOutlined />,
            content: '刪除後，騎乘者資料將無法返回。',
            okText: '刪除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => deleteUser(id),
        });
    };

    const deleteUser = async (id) => {
        const theUserRef = doc(usersRef, id);
        await updateDoc(theUserRef, {
            isDeleted: true,
        });

        await fetchUsers();

        message.info('使用者已刪除。');
    };

    const openViewModal = (id) => {
        const currUser = users.find((u) => u.id === id);
        setCurrUser(currUser);
        setViewModalVisible(true);
    };

    const openEditModal = (id) => {
        const currUser = users.find((u) => u.id === id);

        editForm.setFieldsValue({ age: currUser.age, name: currUser.name });

        setCurrUser(currUser);
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
        setCurrUser();
        setViewModalVisible(false);
    };

    const closeCreateModal = () => {
        createForm.resetFields();
        setCreateModalVisible(false);
    };

    const closeEditModal = () => {
        setCurrUser();
        setEditModalVisible(false);
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
                        title="騎乘者資訊列表"
                        subTitle="管理騎乘者資訊"
                        onBack={goDashboard}
                        extra={[
                            <Button
                                key={1}
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={openCreateModal}
                            >
                                新增騎乘者
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
                                <Form.Item label="騎乘者名稱" name="name">
                                    <Input
                                        placeholder="輸入騎乘者名稱查詢"
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
                            onDeleteUser,
                        )}
                        dataSource={filteredUser}
                        pagination={{ pageSize: 5 }}
                        style={{ marginLeft: 24, marginRight: 24 }}
                    />
                    <Modal
                        title="檢視騎乘者"
                        visible={viewModalVisible}
                        onCancel={closeViewModal}
                        footer={null} // no [Ok], [Cancel] button
                    >
                        <Descriptions
                            bordered
                            className={styles.descriptions}
                            size="middle"
                        >
                            <Descriptions.Item label="騎乘者姓名" span={3}>
                                {currUser?.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="騎乘者身體年齡">
                                {currUser?.age}
                            </Descriptions.Item>
                        </Descriptions>
                    </Modal>
                    {/* 新增 Modal */}
                    <Modal
                        title="新增騎乘者"
                        visible={createModalVisible}
                        onOk={onCreateUser}
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
                                label="騎乘者姓名"
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上騎乘者姓名',
                                    },
                                ]}
                            >
                                <Input placeholder="" />
                            </Form.Item>
                            <Form.Item
                                label="騎乘者身體年齡"
                                name="age"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上騎乘者身體年齡',
                                    },
                                ]}
                            >
                                <InputNumber min={1} max={99} />
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        title="編輯騎乘者"
                        visible={editModalVisible}
                        onOk={onPatchUser}
                        confirmLoading={loading}
                        onCancel={closeEditModal}
                        destroyOnClose
                    >
                        <Form
                            {...modalFormLayout}
                            form={editForm}
                            layout="horizontal"
                        >
                            <Form.Item label="騎乘者姓名">
                                {currUser?.name}
                            </Form.Item>
                            <Form.Item
                                label="騎乘者身體年齡"
                                name="age"
                                rules={[
                                    {
                                        required: true,
                                        message: '請填上騎乘者身體年齡',
                                    },
                                ]}
                            >
                                <InputNumber min={1} max={99} />
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
        key: 'name',
        title: '騎乘者名稱',
        dataIndex: 'name',
    },
    {
        key: 'age',
        title: '騎乘者年齡',
        dataIndex: 'age',
        sorter: {
            compare: (a, b) => a.age - b.age,
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
                                onClick={() => onDeleteUser(id)}
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

export default UserList;
