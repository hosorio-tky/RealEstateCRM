import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import { PropertyService } from '@/services/PropertyService';
import { ContactService } from '@/services/ContactService';

const { Option } = Select;

const OpportunityForm = ({ initialValues, onFinish, loading }) => {
    const [form] = Form.useForm();
    const [properties, setProperties] = useState([]);
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        const fetchOptions = async () => {
            const [propRes, contactRes] = await Promise.all([
                PropertyService.getProperties({ pageSize: 100 }),
                ContactService.getContacts()
            ]);

            if (propRes.data) setProperties(propRes.data);
            if (contactRes.data) setContacts(contactRes.data);

            // Handle error logging if needed
            if (propRes.error) console.error("Properties load error", propRes.error);
            if (contactRes.error) console.error("Contacts load error", contactRes.error);
        };
        fetchOptions();
    }, []);

    // Reset form when initialValues change
    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                ...initialValues,
                // Ensure budget is just a string or number, not full obj
                budget: initialValues.budget,
                contact_id: initialValues.contact_id || initialValues.contact?.id,
                property_id: initialValues.property_id || initialValues.property?.id
            });
        } else {
            form.resetFields();
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
                name="title"
                label="Opportunity Title"
                rules={[{ required: true, message: 'Please enter a title (e.g. "Looking for Downtown Apt")' }]}
            >
                <Input placeholder="e.g. Investment Property Search" />
            </Form.Item>

            <Form.Item
                name="contact_id"
                label="Contact"
                rules={[{ required: true, message: 'Please select a contact' }]}
            >
                <Select
                    showSearch
                    placeholder="Select a contact"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={contacts.map(c => ({
                        value: c.id,
                        label: `${c.name} (${c.email})`
                    }))}
                />
            </Form.Item>

            <Form.Item
                name="budget"
                label="Budget"
            >
                <Input type="number" prefix="$" placeholder="500000" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="property_id"
                label="Interested Property"
            >
                <Select
                    placeholder="Select a property"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                >
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
                    {initialValues ? 'Update Opportunity' : 'Create Opportunity'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default OpportunityForm;
