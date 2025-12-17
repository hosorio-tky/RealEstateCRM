'use client';
import React, { useState } from 'react';
import {
    DesktopOutlined,
    FileTextOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, Avatar, Button, Input } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Content, Sider } = Layout;

function getItem(label, key, icon, children) {
    return {
        key,
        icon,
        children,
        label,
    };
}

const items = [
    getItem('Dashboard', '1', <PieChartOutlined />),
    getItem('Contactos', '6', <TeamOutlined />), // New Contacts page
    getItem('Propiedades', '2', <DesktopOutlined />),
    getItem('Oportunidades', '3', <UserOutlined />), // Was Leads, now Opportunities List
    getItem('Pipeline', '4', <FileTextOutlined />), // Kanban
    getItem('Administración', '5', <TeamOutlined />),
];

const DashboardLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const { user, signOut } = useAuth();

    const router = useRouter();
    const pathname = usePathname();

    const getSelectedKey = () => {
        if (pathname.includes('/contacts')) return ['6'];
        if (pathname.includes('/properties')) return ['2'];
        if (pathname.includes('/leads')) return ['3'];
        if (pathname.includes('/pipeline')) return ['4'];
        if (pathname.includes('/dashboard')) return ['1'];
        return ['1'];
    };

    const handleMenuClick = (e) => {
        if (e.key === '1') router.push('/dashboard');
        if (e.key === '6') router.push('/contacts');
        if (e.key === '2') router.push('/properties');
        if (e.key === '3') router.push('/leads');
        if (e.key === '4') router.push('/pipeline');
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div className="demo-logo-vertical" style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px' }} />
                <Menu theme="dark" selectedKeys={getSelectedKey()} mode="inline" items={items} onClick={handleMenuClick} />
            </Sider>
            <Layout>
                <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h3>RealEstate CRM</h3>
                        <Input.Search placeholder="Buscar..." style={{ width: 200 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ marginRight: '10px' }}>{user?.email}</span>
                        <Avatar icon={<UserOutlined />} />
                        <Button type="link" onClick={signOut}>Sign Out</Button>
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px' }}>
                    <div
                        style={{
                            padding: 24,
                            minHeight: 360,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout;
