import { FC } from 'react';
import { EdgeProps, EdgeLabelRenderer, BaseEdge, getSmoothStepPath } from 'reactflow';

const CustomEdge: FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    markerEnd
}) => {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });
    return (
        <>
            <BaseEdge id={id} path={edgePath} style={{ stroke: 'grey', }} markerEnd={markerEnd} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        background: '#ffcc00',
                        padding: 10,
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: 400,
                    }}
                >
                    {label}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

export default CustomEdge;
