/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Input, Button, message, Form, Typography } from 'antd';
import { signInWithEmailAndPassword } from 'firebase/auth';

// import Header from '../../components/Header';
import styles from './styles.module.scss';
import { ROUTE_PATH, ROLES } from '../../constants';
import { useStore } from '../../store';
import { SET_AUTH } from '../../store/actions';
import { auth } from '../../services/firebase';

const { Content } = Layout;
const { Title } = Typography;

const SignIn = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { dispatch } = useStore();
    const [loading, setLoading] = useState(false);

    const login = async () => {
        try {
            setLoading(true);

            const values = await form.validateFields();
            console.log(values);

            const userCredential = await signInWithEmailAndPassword(
                auth,
                values.email,
                values.password,
            );

            const user = userCredential.user;
            setLoading(false);
            dispatch({
                type: SET_AUTH,
                payload: {
                    isValid: true,
                    roles: [ROLES.Admin],
                },
            });

            goDashboard();
        } catch (e) {
            console.log(e);
            console.log(e?.message);
            setLoading(false);
            message.error('帳號或密碼有誤。');
        }
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord, { replace: true });
    };

    return (
        <Layout>
            <Content className="site-layout" style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <Form
                        {...formLayout}
                        form={form}
                        layout="horizontal"
                        autoComplete="off"
                    >
                        <Form.Item
                            label=" "
                            colon={false}
                            style={{ marginBottom: 12 }}
                        >
                            <Title level={2}>長庚大學-物理治療系統登入2</Title>
                        </Form.Item>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: '請填入 Email',
                                },
                            ]}
                        >
                            <Input placeholder="" type="email" />
                        </Form.Item>
                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: '請填入 Password',
                                },
                            ]}
                        >
                            <Input.Password placeholder="" />
                        </Form.Item>
                        <Form.Item {...tailLayout}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                onClick={login}
                                loading={loading}
                            >
                                登入
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </Content>
        </Layout>
    );
};

const formLayout = {
    labelCol: {
        span: 7,
    },
    wrapperCol: {
        span: 12,
    },
};

const tailLayout = {
    wrapperCol: {
        offset: 7,
        span: 16,
    },
};

export default SignIn;
