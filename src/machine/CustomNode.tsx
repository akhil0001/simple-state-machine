import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { THandle } from './createMachine';
import { TDefaultStates } from './types';

const HANDLE_POS_ARR = [Position.Left, Position.Bottom, Position.Right, Position.Top];

interface ICustomNodeProps<V extends TDefaultStates> {
    data: {
        label: string;
        handles: THandle<V>[]
    }
}

export const CustomNode = memo(({ data }: ICustomNodeProps<TDefaultStates>) => {
    return (
        <>
            <div
                style={{
                    padding: 10,
                    border: '3px solid #111',
                    borderRadius: '5px',
                    boxShadow: '6px 6px 0 1px rgba(0, 0, 0, 0.4)'
                }}
            >
                <div>{data.label}</div>
                {data.handles.map((handle: string, index: number) => {
                    return (
                        <Handle type="source" id={handle} key={handle} isConnectable={false} position={HANDLE_POS_ARR[index % 4]} />
                    )
                })}
                {data.handles.map((handle: string, index: number) => {
                    return (
                        <Handle type="target" id={handle} key={handle} isConnectable={false} position={HANDLE_POS_ARR[index % 4]} />
                    )
                })}
            </div>
        </>
    );
});
