'use client';
import React, { useState, useEffect } from 'react';
import {
    DesktopOutlined,
    FileTextOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined,
    MenuOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, Avatar, Button, Input, Drawer, Grid } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

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
    getItem('Contactos', '6', <TeamOutlined />),
    getItem('Propiedades', '2', <DesktopOutlined />),
    getItem('Oportunidades', '3', <UserOutlined />),
    getItem('Pipeline', '4', <FileTextOutlined />),
    getItem('Administración', '5', <TeamOutlined />),
];

const DashboardLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const screens = useBreakpoint();

    // Ant Design's useBreakpoint returns an empty object during SSR.
    // We use 'mounted' to ensure we only render mobile-specific UI on the client.
    useEffect(() => {
        setMounted(true);
    }, []);

    const isMobile = mounted && !screens.md;

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
        if (e.key === '6') router.push('/contacts');
        else if (e.key === '2') router.push('/properties');
        else if (e.key === '3') router.push('/leads');
        else if (e.key === '4') router.push('/pipeline');
        else router.push('/dashboard');

        setMobileMenuOpen(false);
    };

    // Prevent rendering the responsive parts until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Layout>
                    <Header style={{ background: '#fff', padding: '0 24px' }}>
                        <h3>RealEstate CRM</h3>
                    </Header>
                    <Content style={{ margin: '24px 16px' }}>
                        <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Desktop Sider */}
            {!isMobile && (
                <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                    <div className="demo-logo-vertical" style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px' }} />
                    <Menu theme="dark" selectedKeys={getSelectedKey()} mode="inline" items={items} onClick={handleMenuClick} />
                </Sider>
            )}

            {/* Mobile Drawer */}
            <Drawer
                title="RealEstate CRM"
                placement="left"
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                styles={{ body: { padding: 0 } }}
                style={{ width: 250 }}
            >
                <Menu
                    mode="inline"
                    selectedKeys={getSelectedKey()}
                    items={items}
                    onClick={handleMenuClick}
                    style={{ borderRight: 0 }}
                />
                <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0' }}>
                    <Button type="primary" block onClick={signOut}>Sign Out</Button>
                </div>
            </Drawer>

            <Layout>
                <Header style={{
                    padding: isMobile ? '0 12px' : '0 24px',
                    background: colorBgContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '20px', flex: 1 }}>
                        {isMobile && (
                            <Button
                                icon={<MenuOutlined />}
                                onClick={() => setMobileMenuOpen(true)}
                                style={{ border: 'none', background: 'transparent' }}
                            />
                        )}
                        <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', whiteSpace: 'nowrap' }}>
                            {isMobile ? 'CRM' : 'RealEstate CRM'}
                        </h3>
                        {!isMobile && <Input.Search placeholder="Buscar..." style={{ width: 200 }} />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '15px' }}>
                        {!isMobile && <span style={{ marginRight: '10px' }}>{user?.email}</span>}
                        <Avatar icon={<UserOutlined />} size={isMobile ? 'small' : 'default'} />
                        {!isMobile && <Button type="link" onClick={signOut}>Sign Out</Button>}
                    </div>
                </Header>
                <Content style={{ margin: isMobile ? '12px 0' : '24px 16px' }}>
                    <div
                        style={{
                            padding: isMobile ? 12 : 24,
                            minHeight: 360,
                            background: colorBgContainer,
                            borderRadius: isMobile ? 0 : borderRadiusLG,
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
