
export const FunctionComponent = 0; // 函数类型
export const ClassComponent = 1; // class类型
export const IndeterminateComponent = 2; // Indeterminate是模糊的意思, 这个会在函数组件初次渲染时用到
export const HostRoot = 3; // Root 类型
export const HostPortal = 4; // portal组件用的到
export const HostComponent = 5; // 源生dom节点的类型
export const HostText = 6; // 文本类型
export const Fragment = 7; // fragment
export const Mode = 8;
export const ContextConsumer = 9; // context用到
export const ContextProvider = 10; // context用的到

// const ForwardRef = 11 // ref会用到
// const Profiler = 12 // polyfill会用到
// const SuspenseComponent = 13 // suspense组件会用到
// const MemoComponent = 14 // 函数使用memo时会用到
// const SimpleMemoComponent = 15
// const LazyComponent = 16 // 懒加载
// const IncompleteClassComponent = 17