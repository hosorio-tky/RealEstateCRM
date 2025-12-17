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
            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Ventas Totales"
                            value={112893}
                            precision={2}
                            styles={{ content: { color: '#3f8600' } }}
                            prefix={<ArrowUpOutlined />}
                            suffix="$"
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Leads Activos"
                            value={93}
                            styles={{ content: { color: '#cf1322' } }}
                            prefix={<ArrowDownOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic title="Propiedades Nuevas" value={5} />
                    </Card>
                </Col>
            </Row>
            <div style={{ marginTop: '24px' }}>
                <h2>Bienvenido, {user.email}</h2>
                <p>Este es tu panel de control principal.</p>
            </div>
        </DashboardLayout>
    )
}
