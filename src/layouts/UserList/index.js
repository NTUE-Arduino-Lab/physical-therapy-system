/* eslint-disable react/display-name */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocs } from 'firebase/firestore';
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
    Table,
    Space,
} from 'antd';
import {
    PlusOutlined,
    MoreOutlined,
    LoadingOutlined,
    ExclamationCircleOutlined,
    SettingOutlined,
    ArrowRightOutlined,
} from '@ant-design/icons';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import { usersRef } from '../../services/firebase';

const { Content } = Layout;

const UserList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        fetchUsers();
    };

    const fetchUsers = async () => {
        const users = [];
        const querySnapshot = await getDocs(usersRef);
        querySnapshot.forEach((doc) => {
            users.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        setUsers(users);
    };

    const onDeleteUser = () => {};

    const openEditModal = () => {};

    const openCreateModal = () => {};

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    return (
        <Layout>
            <Content className="site-layout" style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <PageHeader
                        className={styles.PageHeader}
                        title="騎乘者資訊列表"
                        subTitle="維護騎乘者資訊"
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
                        // onFinish={onFinishFilter}
                        initialValues={{ category: ['tv'] }}
                        {...formLayout}
                        style={{ marginTop: 36 }}
                    >
                        <Row gutter={[16, 0]}>
                            <Col span={16}>
                                <Form.Item label="騎乘者名稱" name="name">
                                    <Input placeholder="EX: 王大明" />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit">
                                        查詢
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                    <Table
                        columns={columns(openEditModal, onDeleteUser, users)}
                        dataSource={users}
                        pagination={{ pageSize: 5 }}
                        style={{ marginLeft: 24, marginRight: 24 }}
                    />
                </div>
            </Content>
        </Layout>
    );
};

const columns = (openEditModal, onDeleteUser) => [
    {
        title: '騎乘者名稱',
        dataIndex: 'name',
    },
    {
        title: '騎乘者年齡',
        dataIndex: 'age',
        sorter: {
            compare: (a, b) => a.age - b.age,
        },
        width: 200,
    },
    {
        title: ' ',
        dataIndex: 'id',
        align: 'center',
        render: (id) => {
            return (
                <Popover
                    content={
                        <Space direction="vertical" size="small">
                            <Button type="link">查看</Button>
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
                    <MoreOutlined rotate={90} style={{ fontSize: '14px' }} />
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

export default UserList;
