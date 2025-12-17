import React from 'react';
import { Form, Input, Select, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const ActivityForm = ({ initialValues, onFinish, loading }) => {
    const [form] = Form.useForm();

    React.useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                ...initialValues,
                scheduled_at: initialValues.scheduled_at ? dayjs(initialValues.scheduled_at) : null
            });
        } else {
            form.resetFields();
        }
    }, [initialValues, form]);

    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
                name="activity_type"
                label="Type"
                rules={[{ required: true, message: 'Select type' }]}
            >
                <Select>
                    <Option value="Llamada">Llamada</Option>
                    <Option value="WhatsApp">WhatsApp</Option>
                    <Option value="Email">Email (Correo)</Option>
                    <Option value="Reunion/Visita">Cita / Visita</Option>
                    <Option value="Tarea">Tarea</Option>
                    <Option value="Otro">Otro</Option>
                </Select>
            </Form.Item>

            <Form.Item
                name="scheduled_at"
                label="Due Date"
                rules={[{ required: true, message: 'Select date' }]}
            >
                <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="notes"
                label="Notes"
            >
                <Input.TextArea rows={3} />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block>
                {initialValues ? 'Update Activity' : 'Schedule Activity'}
            </Button>
        </Form>
    );
};

export default ActivityForm;
