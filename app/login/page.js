'use client';
import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const { signIn, signUpWithProfile } = useAuth();
    const router = useRouter();

    const onLoginFinish = async (values) => {
        setLoading(true);
        const { error } = await signIn(values.email, values.password);
        setLoading(false);
        if (error) {
            message.error(error.message);
        } else {
            message.success('Login successful!');
            router.push('/dashboard');
        }
    };

    const onRegisterFinish = async (values) => {
        setLoading(true);
        // Use the new proper method for registration + profile creation
        const { error } = await signUpWithProfile(values.email, values.password);
        setLoading(false);
        if (error) {
            message.error(error.message);
        } else {
            message.success('Registration successful! Please check your email.');
        }
    };

    const loginForm = (
        <Form
            name="login_form"
            onFinish={onLoginFinish}
            layout="vertical"
        >
            <Form.Item
                name="email"
                rules={[
                    { required: true, message: 'Please input your Email!' },
                    { type: 'email', message: 'The input is not valid E-mail!' }
                ]}
            >
                <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
            </Form.Item>
            <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                    Log in
                </Button>
            </Form.Item>
        </Form>
    );

    const registerForm = (
        <Form
            name="register_form"
            onFinish={onRegisterFinish}
            layout="vertical"
        >
            <Form.Item
                name="email"
                rules={[
                    { required: true, message: 'Please input your Email!' },
                    { type: 'email', message: 'The input is not valid E-mail!' }
                ]}
            >
                <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
            </Form.Item>
            <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please input your Password!' }]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>
            <Form.Item
                name="confirm"
                dependencies={['password']}
                hasFeedback
                rules={[
                    { required: true, message: 'Please confirm your password!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('The new password that you entered does not match!'));
                        },
                    }),
                ]}
            >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" size="large" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                    Register
                </Button>
            </Form.Item>
        </Form>
    );

    const items = [
        { key: '1', label: 'Login', children: loginForm },
        { key: '2', label: 'Register', children: registerForm },
    ];

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <Card hoverable style={{ width: 400, borderRadius: '8px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Title level={3}>RealEstate CRM</Title>
                </div>
                <Tabs defaultActiveKey="1" items={items} centered />
            </Card>
        </div>
    );
};

export default LoginPage;
