import React, { useEffect, useState } from 'react';
import { Timeline, Typography, Tag, Card, Spin, Empty } from 'antd';
import { AuditService } from '@/services/AuditService';
import dayjs from 'dayjs';
import {
    EditOutlined,
    PlusOutlined,
    DeleteOutlined,
    UserOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const AuditLogTab = ({ entityType, entityId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const { data, error } = await AuditService.getLogs(entityType, entityId);
            if (!error) {
                setLogs(data);
            }
            setLoading(false);
        };

        if (entityId) {
            fetchLogs();
        }
    }, [entityType, entityId]);

    const getActionIcon = (action) => {
        switch (action) {
            case 'INSERT': return <PlusOutlined style={{ color: 'green' }} />;
            case 'UPDATE': return <EditOutlined style={{ color: 'blue' }} />;
            case 'DELETE': return <DeleteOutlined style={{ color: 'red' }} />;
            default: return <ClockCircleOutlined />;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'INSERT': return 'green';
            case 'UPDATE': return 'blue';
            case 'DELETE': return 'red';
            default: return 'gray';
        }
    };

    const formatDiff = (oldValues, newValues) => {
        if (!oldValues) return <Text type="secondary">Record created</Text>;

        const changes = [];
        const ignoredKeys = ['id', 'created_at', 'updated_at'];

        Object.keys(newValues).forEach(key => {
            if (!ignoredKeys.includes(key) && JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
                changes.push(
                    <div key={key} style={{ marginBottom: '4px' }}>
                        <Text strong>{key}:</Text>
                        <Text delete type="secondary" style={{ margin: '0 4px' }}>
                            {oldValues[key] === null ? 'null' : String(oldValues[key])}
                        </Text>
                        →
                        <Text style={{ marginLeft: '4px' }}>
                            {newValues[key] === null ? 'null' : String(newValues[key])}
                        </Text>
                    </div>
                );
            }
        });

        return changes.length > 0 ? changes : <Text type="secondary">No significant fields changed</Text>;
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Spin tip="Loading history..." /></div>;

    if (logs.length === 0) return <Empty description="No history found for this record." style={{ marginTop: 40 }} />;

    return (
        <div style={{ padding: '20px 0' }}>
            <Timeline mode="left">
                {logs.map(log => (
                    <Timeline.Item
                        key={log.id}
                        dot={getActionIcon(log.action)}
                        label={dayjs(log.created_at).format('DD MMM YYYY HH:mm')}
                    >
                        <Card size="small" style={{ marginBottom: '10px' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <Tag color={getActionColor(log.action)}>{log.action}</Tag>
                                <Text strong style={{ marginLeft: 8 }}>
                                    <UserOutlined style={{ marginRight: 4 }} />
                                    {log.user?.name || 'Sistema / Desconocido'}
                                </Text>
                            </div>
                            <div style={{ fontSize: '13px' }}>
                                {formatDiff(log.old_values, log.new_values)}
                            </div>
                        </Card>
                    </Timeline.Item>
                ))}
            </Timeline>
        </div>
    );
};

export default AuditLogTab;
