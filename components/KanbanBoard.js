'use client';
import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Avatar, Tag, Typography, Grid } from 'antd';
const { useBreakpoint } = Grid;
import { UserOutlined } from '@ant-design/icons';
import { OpportunityService } from '@/services/OpportunityService';
import { DollarOutlined } from '@ant-design/icons';
// ... other imports

const { Text } = Typography;

const STAGES = ['Nuevo', 'Contactado', 'Cita/Visita', 'Negociacion', 'Cerrado', 'Perdido'];

// --- Draggable Card Item ---
const SortableItem = ({ id, item }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: '8px',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card size="small" hoverable style={{ cursor: 'grab' }}>
                <Card.Meta
                    avatar={<Avatar style={{ backgroundColor: '#87d068' }} icon={<DollarOutlined />} />}
                    title={<Text ellipsis>{item.title}</Text>} // Display Opportunity Title
                    description={
                        <div style={{ fontSize: '12px' }}>
                            <div style={{ fontWeight: 500 }}>{item.contact?.name}</div>
                            <div style={{ color: '#888' }}>{item.budget ? `$${Number(item.budget).toLocaleString()}` : '-'}</div>
                            <Tag color="geekblue" style={{ marginTop: 4 }}>{item.stage}</Tag>
                        </div>
                    }
                />
            </Card>
        </div>
    );
};

// ... Column Container (mostly generic, just rename props logic internally if needed) ...
// The generic Column component uses `items` prop so it should be fine as is if we pass opportunities.
// But we need to update `items.map(lead => ...)` to `items.map(item => ...)` inside Column if strict.
// Looking at lines 84-86: {items.map((lead) => (<SortableItem key={lead.id} id={lead.id} lead={lead} />))}
// We need to update that to pass `item={lead}` (variable renaming for clarity).

const Column = ({ id, items }) => {
    const { setNodeRef } = useSortable({ id });
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    return (
        <div
            ref={setNodeRef}
            style={{
                flex: isMobile ? '0 0 85vw' : '0 0 280px',
                backgroundColor: '#f0f2f5',
                borderRadius: '8px',
                padding: isMobile ? '8px' : '12px',
                marginRight: '12px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: isMobile ? 'calc(100vh - 200px)' : 'auto',
            }}
        >
            <div style={{
                marginBottom: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#595959',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{id}</Text>
                <Tag style={{ margin: 0 }}>{items.length}</Tag>
            </div>
            <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
                <div style={{
                    flex: 1,
                    minHeight: '100px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                }}>
                    {items.map((item) => (
                        <SortableItem key={item.id} id={item.id} item={item} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
};


// --- Main Kanban Board ---
const KanbanBoard = ({ initialItems }) => {
    const [items, setItems] = useState({});
    const [activeId, setActiveId] = useState(null);

    useEffect(() => {
        const grouped = STAGES.reduce((acc, stage) => {
            acc[stage] = initialItems.filter(i => i.stage === stage);
            return acc;
        }, {});
        setItems(grouped);
    }, [initialItems]);

    // ... sensors, handleDragStart ... (keep same)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        const findContainer = (id) => {
            if (id in items) return id;
            return Object.keys(items).find((key) => items[key].find((item) => item.id === id));
        };

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (
            !activeContainer ||
            !overContainer ||
            activeContainer === overContainer
        ) {
            setActiveId(null);
            return;
        }

        const activeItem = items[activeContainer].find(i => i.id === activeId);

        setItems((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.indexOf(activeItem);
            const overIndex = overId in prev ? overItems.length + 1 : overItems.findIndex(i => i.id === overId);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item.id !== active.id),
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    { ...activeItem, stage: overContainer },
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length),
                ],
            };
        });

        // Persist to DB using OpportunityService
        await OpportunityService.updateOpportunity(activeId, { stage: overContainer });
        setActiveId(null);
    };

    const activeItem = activeId ? Object.values(items).flat().find(i => i.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '20px' }}>
                {STAGES.map((stage) => (
                    <Column key={stage} id={stage} items={items[stage] || []} />
                ))}
            </div>
            <DragOverlay>
                {activeItem ? (
                    <Card size="small" style={{ cursor: 'grabbing', transform: 'scale(1.05)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }} styles={{ body: { padding: '8px' } }}>
                        <Card.Meta
                            avatar={<Avatar style={{ backgroundColor: '#87d068' }} icon={<DollarOutlined />} />}
                            title={<Text ellipsis>{activeItem.title}</Text>}
                            description={<Text type="secondary">{activeItem.contact?.name}</Text>}
                        />
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
