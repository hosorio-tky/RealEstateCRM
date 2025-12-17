'use client';
import React, { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import DashboardLayout from '@/components/DashboardLayout';
import KanbanBoard from '@/components/KanbanBoard';
import { OpportunityService } from '@/services/OpportunityService';

const PipelinePage = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        setLoading(true);
        const { data, error } = await OpportunityService.getOpportunities();
        setLoading(false);
        if (error) {
            message.error('Failed to load opportunities');
        } else {
            setOpportunities(data || []);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '24px' }}>
                <h2>Pipeline de Ventas</h2>
                <p>Arrastra y suelta las oportunidades para actualizar su etapa.</p>
            </div>
            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <KanbanBoard initialItems={opportunities} />
            )}
        </DashboardLayout>
    );
};

export default PipelinePage;
