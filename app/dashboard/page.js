'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, Row, Col, Statistic } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>
    if (!user) return null

    return (
        <DashboardLayout>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title="Ventas Totales"
                            value={112893}
                            precision={2}
                            valueStyle={{ color: '#3f8600', fontSize: '20px' }}
                            prefix={<ArrowUpOutlined />}
                            suffix="$"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title="Leads Activos"
                            value={93}
                            valueStyle={{ color: '#cf1322', fontSize: '20px' }}
                            prefix={<ArrowDownOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title="Propiedades Nuevas"
                            value={5}
                            valueStyle={{ fontSize: '20px' }}
                        />
                    </Card>
                </Col>
            </Row>
            <div style={{ marginTop: '24px' }}>
                <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 2rem)' }}>Bienvenido</h2>
                <p>{user.email}</p>
                <p>Este es tu panel de control principal.</p>
            </div>
        </DashboardLayout>
    )
}
