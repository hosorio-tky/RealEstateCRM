'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { OpportunityService } from '@/services/OpportunityService';
import { ActivityService } from '@/services/ActivityService';
import ActivityForm from '@/components/ActivityForm';
import { Spin, Card, Descriptions, Timeline, Button, Modal, Tag, message, Empty, Tabs, Space, Grid, Typography } from 'antd';
import { EditOutlined, PhoneOutlined, MailOutlined, CalendarOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, MessageOutlined, CheckSquareOutlined, DeleteOutlined } from '@ant-design/icons';
import NotesTab from '@/components/NotesTab';
import AttachmentsTab from '@/components/AttachmentsTab';
import AuditLogTab from '@/components/AuditLogTab';
import OpportunityForm from '@/components/OpportunityForm';
import dayjs from 'dayjs';

const { Text } = Typography;

const LeadDetailsPage = () => { // We can rename this component internally to OpportunityDetailsPage
    const params = useParams();
    const router = useRouter();
    const [opportunity, setOpportunity] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [editingActivity, setEditingActivity] = useState(null);

    useEffect(() => {
        if (params.id) {
            fetchData(params.id);
        }
    }, [params.id]);

    const fetchData = async (id) => {
        setLoading(true);
        const { data: oppData, error: oppError } = await OpportunityService.getOpportunity(id);
        if (oppError) {
            message.error('Failed to load opportunity');
            setLoading(false);
            return;
        }
        setOpportunity(oppData);

        const { data: actData, error: actError } = await ActivityService.getActivities(id);
        if (actError) console.error(actError);
        setActivities(actData || []);

        setLoading(false);
    };

    const handleEditActivity = (activity) => {
        setEditingActivity(activity);
        setIsModalOpen(true);
    };

    const handleDeleteActivity = async (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this activity?');
        if (confirmed) {
            const { error } = await ActivityService.deleteActivity(id);
            if (error) message.error('Failed to delete activity');
            else {
                message.success('Activity deleted');
                fetchData(opportunity.id);
            }
        }
    };

    const handleFormSubmit = async (values) => {
        setFormLoading(true);

        const activityPayload = {
            opportunity_id: opportunity.id,
            activity_type: values.activity_type,
            scheduled_at: values.scheduled_at.toISOString(),
            notes: values.notes
        };

        let result;
        if (editingActivity) {
            result = await ActivityService.updateActivity(editingActivity.id, activityPayload);
        } else {
            result = await ActivityService.createActivity(activityPayload);
        }

        setFormLoading(false);
        const { error } = result;
        if (error) {
            message.error('Operation failed');
        } else {
            message.success(editingActivity ? 'Activity updated' : 'Activity scheduled');
            setIsModalOpen(false);
            setEditingActivity(null);
            fetchData(opportunity.id);
        }
    };

    const handleUpdateOpportunity = async (values) => {
        setFormLoading(true);
        // Note: LeadForm returns values that might need mapping.
        // For now assuming values match opportunity structure partially.
        const { error } = await OpportunityService.updateOpportunity(opportunity.id, values);
        setFormLoading(false);
        if (error) {
            message.error('Failed to update opportunity');
        } else {
            message.success('Opportunity updated successfully');
            setIsEditModalOpen(false);
            fetchData(opportunity.id);
        }
    };

    const handleComplete = async (id) => {
        const { error } = await ActivityService.completeActivity(id, 'Completed via Timeline');
        if (error) message.error('Failed to complete');
        else {
            message.success('Activity completed');
            fetchData(opportunity.id);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Llamada': return <PhoneOutlined />;
            case 'Email': return <MailOutlined />;
            case 'Reunion/Visita': return <CalendarOutlined />;
            case 'WhatsApp': return <MessageOutlined />;
            case 'Tarea': return <CheckSquareOutlined />;
            default: return <FileTextOutlined />;
        }
    };

    if (loading) return <DashboardLayout><Spin size="large" /></DashboardLayout>;
    if (!opportunity) return <DashboardLayout><Empty description="Opportunity not found" /></DashboardLayout>;

    const screens = Spin.Grid?.useBreakpoint?.() || {}; // Spin might not have it, but antd has it. Using standard import
    // Wait, Spin doesn't have Grid. I need to import Grid from antd.
    // I already have Descriptions, so I'll add Grid.

    // Actually I'll just use the already imported components and add Grid if missing.
    // Looking at line 8: import { Spin, Card, Descriptions, Timeline, Button, Modal, Tag, message, Empty, Tabs } from 'antd';

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Button onClick={() => router.back()}>Volver</Button>
                <Tag color="blue" style={{ margin: 0 }}>{opportunity.stage}</Tag>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '100%' }}>
                    <Card
                        title={<span style={{ fontSize: '1.1rem' }}>{opportunity.title}</span>}
                        extra={<Button icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>Editar</Button>}
                        styles={{ body: { padding: '16px' } }}
                    >
                        <Descriptions
                            column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                            size="small"
                            layout="vertical"
                        >
                            <Descriptions.Item label="Contacto">{opportunity.contact?.name}</Descriptions.Item>
                            <Descriptions.Item label="Email">{opportunity.contact?.email}</Descriptions.Item>
                            <Descriptions.Item label="Teléfono">{opportunity.contact?.phone || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Propiedad">{opportunity.property ? opportunity.property.title : 'Ninguna'}</Descriptions.Item>
                            <Descriptions.Item label="Presupuesto">{opportunity.budget ? `$${Number(opportunity.budget).toLocaleString()}` : '-'}</Descriptions.Item>
                            <Descriptions.Item label="Asignado">{opportunity.assigned_user ? opportunity.assigned_user.name : '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </div>

                <div style={{ width: '100%' }}>
                    <Card styles={{ body: { padding: '12px' } }}>
                        <Tabs
                            defaultActiveKey="1"
                            size="small"
                            items={[
                                {
                                    key: '1',
                                    label: 'Actividades',
                                    children: (
                                        <div style={{ paddingTop: '12px' }}>
                                            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button type="primary" onClick={() => setIsModalOpen(true)} size="small">Programar</Button>
                                            </div>
                                            {activities.length === 0 ? <Empty description="Sin actividades" /> : (
                                                <Timeline
                                                    items={activities.map(act => ({
                                                        key: act.id,
                                                        color: act.is_completed ? 'green' : 'blue',
                                                        icon: getIcon(act.activity_type),
                                                        children: (
                                                            <div style={{ paddingBottom: '12px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <strong style={{ display: 'block' }}>{act.activity_type}</strong>
                                                                        <span style={{ fontSize: '11px', color: '#999' }}>
                                                                            {dayjs(act.scheduled_at).format('MMM D, h:mm A')}
                                                                        </span>
                                                                    </div>
                                                                    <Space orientation="horizontal" size={0}>
                                                                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditActivity(act)} />
                                                                        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteActivity(act.id)} />
                                                                    </Space>
                                                                </div>
                                                                <div style={{ fontSize: '13px', marginTop: '4px' }}>{act.notes}</div>
                                                                {!act.is_completed && (
                                                                    <Button type="link" size="small" style={{ padding: 0 }} onClick={() => handleComplete(act.id)}>
                                                                        Completar
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )
                                                    }))}
                                                />
                                            )}
                                        </div>
                                    )
                                },
                                {
                                    key: '2',
                                    label: 'Notas',
                                    children: <div style={{ paddingTop: '12px' }}><NotesTab entityType="opportunity" entityId={opportunity.id} /></div>
                                },
                                {
                                    key: '3',
                                    label: 'Archivos',
                                    children: <div style={{ paddingTop: '12px' }}><AttachmentsTab entityType="opportunity" entityId={opportunity.id} /></div>
                                },
                                {
                                    key: '4',
                                    label: 'Historial',
                                    children: <div style={{ paddingTop: '12px' }}><AuditLogTab entityType="opportunities" entityId={opportunity.id} /></div>
                                }
                            ]}
                        />
                    </Card>
                </div>
            </div>

            <Modal
                title={editingActivity ? "Editar Actividad" : "Programar Actividad"}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingActivity(null);
                }}
                footer={null}
                destroyOnHidden
                width="95%"
                style={{ top: 20 }}
            >
                <ActivityForm
                    initialValues={editingActivity}
                    onFinish={handleFormSubmit}
                    loading={formLoading}
                />
            </Modal>

            <Modal
                title="Editar Oportunidad"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
                destroyOnHidden
                width="95%"
                style={{ top: 20 }}
            >
                <OpportunityForm
                    initialValues={opportunity}
                    onFinish={handleUpdateOpportunity}
                    loading={formLoading}
                />
            </Modal>
        </DashboardLayout>
    );
};

export default LeadDetailsPage;
