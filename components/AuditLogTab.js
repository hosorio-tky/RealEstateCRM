import { useState, useEffect } from 'react';
import { Tag, Skeleton, Typography } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { AuditService } from '../services/AuditService';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function AuditLogTab({ tableName, recordId }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [recordId, tableName]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await AuditService.getLogs(tableName, recordId);
            setLogs(data || []);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getChangesText = (log) => {
        if (log.action === 'INSERT') return 'Created the record';
        if (log.action === 'DELETE') return 'Deleted the record';

        // UPDATE: Compare old_data and new_data
        if (!log.old_data || !log.new_data) return 'Updated record';

        const changes = [];
        const ignoreFields = ['updated_at', 'created_at', 'id', 'lead_id'];

        const fieldLabels = {
            property_id: 'Property',
            assigned_user_id: 'Assigned Agent',
            budget_max: 'Budget',
            phone: 'Phone',
            name: 'Name',
            email: 'Email',
            stage: 'Stage'
        };

        const formatValue = (key, value) => {
            if (value === null || value === undefined) return 'Empty';

            // Use lookup if available
            if (log.lookups && log.lookups[key] && log.lookups[key][value]) {
                return log.lookups[key][value];
            }

            // Currency formatting
            if (key === 'budget_max' || key === 'budget') { // Handle both just in case
                return `$${Number(value).toLocaleString()}`;
            }

            return String(value);
        };

        Object.keys(log.new_data).forEach(key => {
            if (ignoreFields.includes(key)) return;
            const oldVal = log.old_data[key];
            const newVal = log.new_data[key];

            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                changes.push(
                    <div key={key}>
                        <Text strong>{fieldLabels[key] || key}</Text>: <Text delete type="secondary">{formatValue(key, oldVal)}</Text> <Text>→</Text> <Text strong>{formatValue(key, newVal)}</Text>
                    </div>
                );
            }
        });

        return changes.length > 0 ? changes : 'Updated record (no specific fields detected)';
    };

    const getColor = (action) => {
        switch (action) {
            case 'INSERT': return 'green';
            case 'UPDATE': return 'blue';
            case 'DELETE': return 'red';
            default: return 'default';
        }
    };

    return (
        <div style={{ marginTop: 20 }}>
            {loading ? <Skeleton active /> : logs.length === 0 ? <div style={{ color: '#999' }}>No history found</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {logs.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
                            <div style={{ marginTop: 4 }}>
                                <HistoryOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Tag color={getColor(item.action)}>{item.action}</Tag>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8em', color: '#999' }}>
                                            {dayjs(item.created_at).format('MMM D, YYYY h:mm A')}
                                        </div>
                                        <div style={{ fontSize: '0.8em', color: '#999' }}>
                                            {item.changed_by_user?.name || item.changed_by_user?.email || 'System'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    {getChangesText(item)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
