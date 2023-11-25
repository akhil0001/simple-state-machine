type TConvertArrToObj<TArr extends readonly string[]> = {
    [TIndex in TArr[number]]: TArr[number]
}

export type TTargetState<IStates extends readonly string[]> = keyof TConvertArrToObj<IStates>;
