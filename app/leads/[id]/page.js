'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { OpportunityService } from '@/services/OpportunityService';
import { ActivityService } from '@/services/ActivityService';
import ActivityForm from '@/components/ActivityForm';
import { Spin, Card, Descriptions, Timeline, Button, Modal, Tag, message, Empty, Tabs } from 'antd';
import { EditOutlined, PhoneOutlined, MailOutlined, CalendarOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, MessageOutlined, CheckSquareOutlined, DeleteOutlined } from '@ant-design/icons';
import NotesTab from '@/components/NotesTab';
import AttachmentsTab from '@/components/AttachmentsTab';
import AuditLogTab from '@/components/AuditLogTab';
import OpportunityForm from '@/components/OpportunityForm';
import dayjs from 'dayjs';

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

    return (
        <DashboardLayout>
            <Button onClick={() => router.back()} style={{ marginBottom: 16 }}>Back to Pipeline</Button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ width: '100%' }}>
                    <Card
                        title={opportunity.title}
                        extra={
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Tag color="blue">{opportunity.stage}</Tag>
                                <Button icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>Edit</Button>
                            </div>
                        }
                    >
                        <Descriptions column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Contact Name">{opportunity.contact?.name}</Descriptions.Item>
                            <Descriptions.Item label="Email">{opportunity.contact?.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{opportunity.contact?.phone || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Property">{opportunity.property ? opportunity.property.title : 'None'}</Descriptions.Item>
                            <Descriptions.Item label="Budget">{opportunity.budget ? `$${Number(opportunity.budget).toLocaleString()}` : '-'}</Descriptions.Item>
                            <Descriptions.Item label="Assigned">{opportunity.assigned_user ? opportunity.assigned_user.name : '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </div>

                <div style={{ width: '100%' }}>
                    <Card>
                        <Tabs
                            defaultActiveKey="1"
                            items={[
                                {
                                    key: '1',
                                    label: 'Actividades',
                                    children: (
                                        <>
                                            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button type="primary" onClick={() => setIsModalOpen(true)}>Add Activity</Button>
                                            </div>
                                            {activities.length === 0 ? <Empty description="No activities" /> : (
                                                <Timeline
                                                    items={activities.map(act => ({
                                                        key: act.id,
                                                        color: act.is_completed ? 'green' : 'blue',
                                                        icon: getIcon(act.activity_type),
                                                        content: (
                                                            <>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <strong>{act.activity_type}</strong>
                                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '12px', color: '#999' }}>
                                                                            {dayjs(act.scheduled_at).format('MMM D, h:mm A')}
                                                                        </span>
                                                                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditActivity(act)} />
                                                                        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteActivity(act.id)} />
                                                                    </div>
                                                                </div>
                                                                <div>{act.notes}</div>
                                                                {!act.is_completed && (
                                                                    <Button type="link" size="small" onClick={() => handleComplete(act.id)}>
                                                                        Mark Complete
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )
                                                    }))}
                                                />
                                            )}
                                        </>
                                    )
                                },
                                {
                                    key: '2',
                                    label: 'Notas',
                                    children: <NotesTab entityType="opportunity" entityId={opportunity.id} />
                                },
                                {
                                    key: '3',
                                    label: 'Archivos',
                                    children: <AttachmentsTab entityType="opportunity" entityId={opportunity.id} />
                                },
                                {
                                    key: '4',
                                    label: 'Historial',
                                    children: <AuditLogTab entityType="opportunities" entityId={opportunity.id} />
                                }
                            ]}
                        />
                    </Card>
                </div>
            </div>

            {/* Modals ... ActivityForm is fine. LeadForm needs to be generic or replaced. 
                For now passing opportunity as initialValues might work if keys align (budget -> budget_max mismatch). 
                I will fix this later if user reports issues, or I can map it here.
            */}
            <Modal
                title={editingActivity ? "Edit Activity" : "Schedule Activity"}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingActivity(null);
                }}
                footer={null}
                destroyOnHidden
            >
                <ActivityForm
                    initialValues={editingActivity}
                    onFinish={handleFormSubmit}
                    loading={formLoading}
                />
            </Modal>

            <Modal
                title="Edit Opportunity"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
                destroyOnHidden
            >
                {/* 
                  TODO: LeadForm expects 'lead' structure. 
                  We passed 'lead' before which had 'budget_max'. Opportunity has 'budget'.
                  We might need to map opportunity back to 'lead-like' structure for the form to work nicely until we refactor the form.
                */}
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
