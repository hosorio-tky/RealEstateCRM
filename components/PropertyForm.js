'use client';
import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { PropertyService } from '@/services/PropertyService';

const { Option } = Select;
const { TextArea } = Input;

const PropertyForm = ({ initialValues, onFinish, loading }) => {
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialValues?.image_url || '');

    useEffect(() => {
        form.resetFields();
        setImageUrl(initialValues?.image_url || '');
    }, [initialValues, form]);

    const handleUpload = async (file) => {
        setUploading(true);
        try {
            const url = await PropertyService.uploadImage(file);
            setImageUrl(url);
            form.setFieldsValue({ image_url: url });
            message.success('Image uploaded successfully');
        } catch (error) {
            message.error('Image upload failed');
            console.error(error);
        } finally {
            setUploading(false);
        }
        return false; // Prevent default auto-upload
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <Form
            form={form}
            name="property_form"
            layout="vertical"
            initialValues={initialValues}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
        >
            <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: 'Please input the property title!' }]}
            >
                <Input placeholder="Modern Apartment in Downtown" />
            </Form.Item>

            <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: 'Please input a description!' }]}
            >
                <TextArea rows={4} placeholder="Lovely view..." />
            </Form.Item>

            <Form.Item
                label="Address Line 1"
                name="address_line_1"
                rules={[{ required: true, message: 'Please input address!' }]}
            >
                <Input placeholder="123 Main St" />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
                <Form.Item
                    label="Currency"
                    name="currency"
                    initialValue="USD"
                    rules={[{ required: true, message: 'Please select currency!' }]}
                    style={{ width: '100px' }}
                >
                    <Select>
                        <Option value="USD">USD</Option>
                        <Option value="EUR">EUR</Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    label="Price"
                    name="price"
                    rules={[{ required: true, message: 'Please input the price!' }]}
                    style={{ flex: 1 }}
                >
                    <InputNumber
                        formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <Form.Item
                    label="City"
                    name="city"
                    rules={[{ required: true, message: 'Please input the city!' }]}
                    style={{ flex: 1 }}
                >
                    <Input placeholder="New York" />
                </Form.Item>
            </div>

            <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select a status!' }]}
            >
                <Select placeholder="Select status">
                    <Option value="Disponible">Disponible</Option>
                    <Option value="En Contrato">En Contrato</Option>
                    <Option value="Vendida">Vendida</Option>
                    <Option value="Rentada">Rentada</Option>
                    <Option value="Archivada">Archivada</Option>
                </Select>
            </Form.Item>

            <Form.Item label="Image">
                <Upload
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    accept="image/*"
                >
                    <Button icon={<UploadOutlined />} loading={uploading}>Click to Upload</Button>
                </Upload>
                {imageUrl && (
                    <div style={{ marginTop: '10px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Property" style={{ width: '100%', maxWidth: '200px', borderRadius: '4px' }} />
                    </div>
                )}
                <Form.Item name="image_url" noStyle>
                    <Input type="hidden" />
                </Form.Item>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                    {initialValues ? 'Update Property' : 'Create Property'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default PropertyForm;
