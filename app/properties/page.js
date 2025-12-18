'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Input, Select, Space, Modal, message, Tag, Grid, Card, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyForm from '@/components/PropertyForm';
import { PropertyService } from '@/services/PropertyService';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const { Option } = Select;
const { Text, Title } = Typography;

const PropertiesPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [filters, setFilters] = useState({ city: '', status: '' });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [userRole, setUserRole] = useState(null);

    // Fetch user role
    useEffect(() => {
        const fetchUserRole = async () => {
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                setUserRole(data?.role);
            }
        };
        fetchUserRole();
    }, [user]);

    const canEdit = userRole === 'Admin' || userRole === 'Editor';

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: properties, count, error } = await PropertyService.getProperties({
            page: pagination.current,
            pageSize: pagination.pageSize,
            filters,
        });
        setLoading(false);
        if (error) {
            message.error('Failed to load properties');
        } else {
            setData(properties || []);
            setPagination((prev) => ({ ...prev, total: count || 0 }));
        }
    }, [pagination.current, pagination.pageSize, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const handleSearch = (value, type) => {
        setFilters((prev) => ({ ...prev, [type]: value }));
        setPagination((prev) => ({ ...prev, current: 1 }));
    };

    const showModal = (record = null) => {
        setEditingProperty(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingProperty(null);
    };

    const handleFormFinish = async (values) => {
        setFormLoading(true);
        let error;
        if (editingProperty) {
            ({ error } = await PropertyService.updateProperty(editingProperty.id, values));
        } else {
            ({ error } = await PropertyService.createProperty(values));
        }
        setFormLoading(false);

        if (error) {
            message.error('Operation failed: ' + error.message);
        } else {
            message.success(editingProperty ? 'Property updated' : 'Property created');
            setIsModalVisible(false);
            fetchData();
        }
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Are you sure delete this property?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                const { error } = await PropertyService.deleteProperty(id);
                if (error) {
                    message.error('Failed to delete');
                } else {
                    message.success('Property deleted');
                    fetchData();
                }
            },
        });
    };

    const columns = [
        {
            title: 'Image',
            dataIndex: 'image_url',
            key: 'image_url',
            render: (url) => url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="prop" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
            ) : 'No Image',
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text) => <b>{text}</b>,
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `$${price?.toLocaleString()}`,
        },
        {
            title: 'City',
            dataIndex: 'city',
            key: 'city',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'Disponible' ? 'green' : status === 'Vendida' ? 'red' : 'gold';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                canEdit && (
                    <Space size="middle">
                        <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
                        <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
                    </Space>
                )
            ),
        },
    ];

    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    return (
        <DashboardLayout>
            <div style={{
                marginBottom: 16,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                gap: '12px'
            }}>
                <Space orientation={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
                    <Input.Search
                        placeholder="Filter by city"
                        onSearch={(val) => handleSearch(val, 'city')}
                        style={{ width: isMobile ? '100%' : 200 }}
                        allowClear
                    />
                    <Select
                        placeholder="Filter by Status"
                        style={{ width: isMobile ? '100%' : 150 }}
                        onChange={(val) => handleSearch(val, 'status')}
                        allowClear
                    >
                        <Option value="Disponible">Disponible</Option>
                        <Option value="Vendida">Vendida</Option>
                        <Option value="En Contrato">En Contrato</Option>
                    </Select>
                </Space>
                {canEdit && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showModal()}
                        block={isMobile}
                    >
                        Add Property
                    </Button>
                )}
            </div>

            {isMobile ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {data.map(item => (
                        <Card
                            key={item.id}
                            cover={item.image_url ? <img alt="prop" src={item.image_url} style={{ height: 200, objectFit: 'cover' }} /> : null}
                            actions={canEdit ? [
                                <EditOutlined key="edit" onClick={() => showModal(item)} />,
                                <DeleteOutlined key="delete" style={{ color: 'red' }} onClick={() => handleDelete(item.id)} />,
                            ] : []}
                            styles={{ body: { padding: '16px' } }}
                        >
                            <Card.Meta
                                title={item.title}
                                description={
                                    <Space orientation="vertical" size={0}>
                                        <Text strong>${item.price?.toLocaleString()}</Text>
                                        <Text type="secondary">{item.city}</Text>
                                        <Tag color={item.status === 'Disponible' ? 'green' : item.status === 'Vendida' ? 'red' : 'gold'}>
                                            {item.status}
                                        </Tag>
                                    </Space>
                                }
                            />
                        </Card>
                    ))}
                    {data.length === 0 && !loading && <Card style={{ textAlign: 'center' }}>No properties found</Card>}
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    pagination={pagination}
                    loading={loading}
                    onChange={handleTableChange}
                />
            )}

            <Modal
                title={editingProperty ? 'Edit Property' : 'Add Property'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnHidden
                width={isMobile ? '95%' : 520}
            >
                <PropertyForm
                    initialValues={editingProperty}
                    onFinish={handleFormFinish}
                    loading={formLoading}
                />
            </Modal>
        </DashboardLayout>
    );
};

export default PropertiesPage;
