'use client';
import React, { useEffect, useState } from 'react';
import { Table, Tag, message, Card, Button, Space, Modal } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { OpportunityService } from '@/services/OpportunityService';
import OpportunityForm from '@/components/OpportunityForm';

const LeadsPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: opportunities, error } = await OpportunityService.getOpportunities();
        setLoading(false);
        if (error) {
            message.error('Error: ' + error.message);
            console.error(error);
        } else {
            setData(opportunities || []);
        }
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Delete this opportunity?',
            content: 'This will remove the deal from the pipeline. The contact will remain.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                const { error } = await OpportunityService.deleteOpportunity(id);
                if (error) {
                    message.error('Failed to delete opportunity');
                } else {
                    message.success('Opportunity deleted');
                    fetchData();
                }
            },
        });
    };

    const handleEdit = (record) => {
        setEditingLead(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingLead(null);
    };

    const handleFormFinish = async (values) => {
        setFormLoading(true);
        let error;

        if (editingLead) {
            const res = await OpportunityService.updateOpportunity(editingLead.id, values);
            error = res.error;
        } else {
            const res = await OpportunityService.createOpportunity(values);
            error = res.error;
        }

        setFormLoading(false);

        if (error) {
            message.error('Error: ' + error.message);
        } else {
            message.success(editingLead ? 'Opportunity updated successfully' : 'Opportunity created successfully');
            setIsModalVisible(false);
            setEditingLead(null);
            fetchData();
        }
    };

    const handleAdd = () => {
        setEditingLead(null);
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => <Link href={`/leads/${record.id}`}>{text}</Link>,
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_, record) => record.contact ? (
                <div>
                    <div>{record.contact.name}</div>
                    <div style={{ fontSize: '0.8em', color: '#888' }}>{record.contact.email}</div>
                </div>
            ) : '-',
        },
        {
            title: 'Stage',
            dataIndex: 'stage',
            key: 'stage',
            render: (stage) => {
                let color = stage === 'Nuevo' ? 'blue' : stage === 'Contactado' ? 'orange' : stage === 'Cerrado' ? 'green' : 'default';
                return <Tag color={color}>{stage}</Tag>;
            },
        },
        {
            title: 'Budget',
            dataIndex: 'budget',
            key: 'budget',
            render: (val) => val ? `$${Number(val).toLocaleString()}` : '-',
        },
        {
            title: 'Property',
            key: 'property',
            render: (_, record) => (
                <span>{record.property ? record.property.title : '-'}</span>
            ),
        },
        {
            title: 'Assigned Agent',
            key: 'assigned_user',
            render: (_, record) => (
                // Accessing the joined data. 
                // We simplified the query to use 'profiles' key directly
                <span>{record.assigned_user?.name || record.assigned_user?.email || 'Unknown'}</span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record.id)} />
                </Space>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <div style={{
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 2rem)', margin: 0 }}>My Opportunities</h2>
                        <p style={{ color: '#666', fontSize: '14px' }}>Deals assigned to you.</p>
                    </div>
                    <Button type="primary" onClick={handleAdd}>Add</Button>
                </div>
            </div>
            <Card styles={{ body: { padding: 0 } }}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, size: 'small' }}
                    scroll={{ x: 800 }}
                    size="small"
                />
            </Card>

            <Modal
                title={editingLead ? "Edit Opportunity" : "Add Opportunity"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnHidden
            >
                <OpportunityForm
                    initialValues={editingLead}
                    onFinish={handleFormFinish}
                    loading={formLoading}
                />
            </Modal>
        </DashboardLayout>
    );
};

export default LeadsPage;
