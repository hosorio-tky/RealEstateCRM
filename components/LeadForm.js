import React from 'react';
import { Form, Input, Select, Button } from 'antd';

import { PropertyService } from '@/services/PropertyService';

const { Option } = Select;

const LeadForm = ({ initialValues, onFinish, loading }) => {
    const [form] = Form.useForm();
    const [properties, setProperties] = React.useState([]);

    React.useEffect(() => {
        const fetchProperties = async () => {
            const { data } = await PropertyService.getProperties({ pageSize: 100 });
            setProperties(data || []);
        };
        fetchProperties();
    }, []);

    // Reset form when initialValues change (for editing different items)
    React.useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        } else {
            form.resetFields();
            // Default stage for new leads
            form.setFieldsValue({ stage: 'Nuevo' });
        }
    }, [initialValues, form]);

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter lead name' }]}
            >
                <Input placeholder="John Doe" />
            </Form.Item>

            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email' }
                ]}
            >
                <Input placeholder="john@example.com" />
            </Form.Item>

            <Form.Item
                name="phone"
                label="Phone"
            >
                <Input placeholder="+1 234 567 8900" />
            </Form.Item>

            <Form.Item
                name="budget_max"
                label="Budget (Max)"
            >
                <Input type="number" prefix="$" placeholder="500000" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="property_id"
                label="Interested Property"
            >
                <Select placeholder="Select a property" allowClear>
                    {properties.map(p => (
                        <Option key={p.id} value={p.id}>{p.title} ({p.status})</Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="stage"
                label="Stage"
            >
                <Select>
                    <Option value="Nuevo">Nuevo</Option>
                    <Option value="Contactado">Contactado</Option>
                    <Option value="Cita/Visita">Cita/Visita</Option>
                    <Option value="Negociacion">Negociación</Option>
                    <Option value="Perdido">Perdido</Option>
                    <Option value="Cerrado">Cerrado</Option>
                </Select>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                    {initialValues ? 'Update Lead' : 'Create Lead'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default LeadForm;
