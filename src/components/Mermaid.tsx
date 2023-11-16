import mermaid from "mermaid"
import { useEffect, useRef } from "react"
import { MachineConfig } from "../machine/MachineConfig";
import { useMachine } from "../hooks";

interface IContext {
    chartStr: string,
    chartEl: HTMLElement | null
}

type TStates = Array<'idle' | 'ready' | 'appending'>

interface IEvent {
    type: 'updateChartStr' | 'updateChartEl'
    data?: {
        chartStr?: string;
        chartEl?: HTMLElement
    }
}

const machine = new MachineConfig<IContext, TStates, IEvent>({
    chartStr: '',
    chartEl: null
})

const { idle, ready, appending } = machine.addStates(['idle', 'ready', 'appending'])

machine.on('updateChartStr')
    .updateContext((context, event) => ({
        ...context,
        chartStr: event.data?.chartStr ?? context.chartStr
    }))

idle.on('updateChartEl')
    .moveTo('ready')
    .updateContext((context, event) => ({
        ...context,
        chartEl: event.data?.chartEl ?? context.chartEl
    }))
    .fireAndForget(() => mermaid.initialize({ startOnLoad: false }))

ready.on('updateChartStr')
    .moveTo('appending')

appending.invokeAsyncCallback(async (context) => {
    const { svg } = await mermaid.render('mermaid-random', context.chartStr)
    if (context.chartEl)
        context.chartEl.innerHTML = svg;
})
    .onDone()
    .moveTo('ready')


export function MermaidInspect({ mermaidStr }: { mermaidStr: string }) {
    const { send } = useMachine(machine)

    const ref = useRef(null);


    useEffect(() => {
        if (ref.current)
            send({
                type: 'updateChartEl',
                data: {
                    chartEl: ref.current
                }
            })
    }, [send])

    useEffect(() => {
        send({
            type: 'updateChartStr',
            data: {
                chartStr: mermaidStr
            }
        })
    }, [mermaidStr, send])

    return (
        <div className="mermaid" ref={ref}>
        </div>
    )
}