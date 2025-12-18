'use client';
import React, { useEffect, useState } from 'react';
import { Table, message, Card, Button, Space, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import DashboardLayout from '@/components/DashboardLayout';
import { ContactService } from '@/services/ContactService';
// import ContactForm from '@/components/ContactForm'; // To be created

const ContactsPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    // const [isModalVisible, setIsModalVisible] = useState(false);
    // const [editingContact, setEditingContact] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: contacts, error } = await ContactService.getContacts();
        setLoading(false);
        if (error) {
            message.error('Error: ' + error.message);
        } else {
            setData(contacts || []);
        }
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Delete this contact?',
            content: 'This will also delete all related opportunities.', // Cascading delete defined in DB
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                const { error } = await ContactService.deleteContact(id);
                if (error) {
                    message.error('Failed to delete contact');
                } else {
                    message.success('Contact deleted');
                    fetchData();
                }
            },
        });
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {/* <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} /> */}
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
                gap: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 2rem)', margin: 0 }}>Contacts</h2>
                        <p style={{ color: '#666', fontSize: '14px' }}>Directory of all people in the CRM.</p>
                    </div>
                    {/* <Button type="primary" icon={<UserAddOutlined />} onClick={handleAdd}>Add</Button> */}
                </div>
            </div>
            <Card styles={{ body: { padding: 0 } }}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, size: 'small' }}
                    scroll={{ x: 600 }}
                    size="small"
                />
            </Card>

            {/* Modal placeholder */}
        </DashboardLayout>
    );
};

export default ContactsPage;
