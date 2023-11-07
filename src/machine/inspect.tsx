import { useEffect, useMemo } from "react";
import ReactFlow, { Background, BackgroundVariant, MarkerType, useEdgesState, useNodesState } from "reactflow";
import CustomEdge from "./CustomEdge";
import { CustomNode } from "./CustomNode";
import { TInspectReturnType, TSubscribe } from "./createMachine";
import { TDefaultContext, TDefaultStates } from "./types";

interface InspectProps {
    inspect: () => TInspectReturnType<TDefaultStates>
    subscribe: TSubscribe<TDefaultContext, TDefaultStates>
}
const edgeTypes = {
    custom: CustomEdge,
};

const nodeTypes = {
    custom: CustomNode
}
export const Inspect = ({ inspect, subscribe }: InspectProps) => {
    const { nodes: nodesFromInspect, edges: edgesFromInspect } = useMemo(() => inspect(), [inspect])
    const initialNodes = useMemo(() => {
        return nodesFromInspect.map((node, index) => ({
            ...node,
            type: 'custom',
            position: {
                x: 50 + 100 * index,
                y: 50 + 100 * index
            }
        }))
    }, [nodesFromInspect])
    const initialEdges = useMemo(() => {
        const res = edgesFromInspect.map((edge) => {
            return {
                ...edge,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                }
            }
        })
        return res;
    }, [edgesFromInspect])
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        subscribe('stateChange', (state) => {
            setNodes((ns) =>
                ns.map((n) => ({
                    ...n,
                    className: state.value === n.id ? 'highlight' : '',
                }))
            )
        })
    }, [subscribe, setNodes])
    return (
        <div style={{ width: '100vw', height: '50vh', border: '1px solid black' }}>
            <ReactFlow nodes={nodes}
                onNodesChange={onNodesChange}
                edges={edges}
                onEdgesChange={onEdgesChange}
                edgeTypes={edgeTypes}
                nodeTypes={nodeTypes}
            >
                <Background variant={BackgroundVariant.Dots} />
            </ReactFlow>
        </div>
    )
}