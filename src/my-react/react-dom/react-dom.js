import { NoWork, msToExpirationTime, Never, Sync }  from './ReactFiberExpirationTime';
import { ConcurrentMode } from './ReactTypeOfMode';
import { HostRoot } from './ReactWorkTags';
import { NoEffect, NoContext } from './ReactSideEffectTag';
import { UpdateState } from './ReactUpdateQueue';

let nextFlushedExpirationTime = NoWork; // 表示下一个要被执行render的fiber的expitationTime
let isWorking = false; // 表示正在工作阶段 render阶段端和commit阶段都是working阶段
let isCommitting = false; // 表示现在是否提交阶段
let nextRenderExpirationTime = NoWork; // 表示正在执行render的过程中 可以允许执行render的最大时间 在这个时间内都可以中断 超过了就不能中断了
let isRendering = false; // 表示正在render阶段 也就是创建或者更新fiber树阶段

// 用来记录react应用最初执行时间以及计算
let originalStartTimeMs = performance.now();
let currentRenderTime = msToExpirationTime(originalStartTimeMs);
let currentSchedulerTime = currentRenderTime;
let expirationContext = NoWork;


/**
 * 
 * @param {*} parentComponent 父组件
 * @param {*} children 
 * @param {*} container root 容器
 * @param {*} forceHydrate 服务端渲染
 * @param {*} callback 
 */
function legacyRenderSubtreeIntoContainer (parentComponent, children, container, forceHydrate, callback ) {
    // _reactRootContainer 就是 FiberRoot
    let root = container._reactRootContainer; 
    if(!root) {
        let isConcurrent = false; // 是否异步
        root = container._reactRootContainer = new ReactRoot(container, isConcurrent);
        // 这里检查callback 
        // ... 处理先跳过

        unbatchedUpdates(function() {
            root.render(children, callback);
        });
    }
}

function unbatchedUpdates(fn, a) {
    return fn(a);
}

function createFiber(tag, pendingProps, key, mode) {
    return new FiberNode(tag, pendingProps, key, mode);
}

class FiberNode {
    // 创建一个fiber数据结构
    constructor(tag, pendingProps, key, mode) {
        this.tag = tag;  // 初次渲染的时候为 HostRoot=> 3
        this.key = key;
        this.elementType = null;
        this.type = null; // 该fiber类型
        this.stateNode = null; //该fiber实例

        // Fiber
        this.return = null; // 父fiber
        this.child = null; // 该fiber的第一个子fiber
        this.sibling = null; // 紧邻着该fiber的兄弟fiber
        this.index = 0; // 该fiber的index
        this.ref = null; // 用来获取真实dom的
        this.pendingProps = pendingProps; // 该fiber的新属性
        this.memorizedProps = null; // 当前fiber的旧属性
        this.updateQueue = null; // 该fiber的更新队列 这个队列上会存放着一个或多个 update
        this.memorizedState = null; // 当前fiber的state
        this.firstContextDependency = null;
        this.mode = mode;

        // Effects
        this.effectTag = NoEffect; // 表示该fiber的更新类型 一般有放置、替换、删除这三个
        this.nextEffect = null; // 下一个effect的fiber 表示下一个更新

        // 这两个属性是一条链表 从 first 指向 last
        this.firstEffect = null; // 第一个 effect的 fiber
        this.lastEffect = null; // 最后一个effect的fiber
        this.expirationTime = NoWork; // 当前fiber的更新优先级
        this.childExpirationTime = NoWork; // 当前fiber的子fiber的更新优先级
        this.alternate = null; // 用来连接上一个状态的当前fiber
    }
}

/**
 * 计算当前时间
 */
function requestCurrentTime() {
    if(isRendering) {
        // 已经开始渲染的话 那么返回最近计算出来的时间
        return currentSchedulerTime;
    };

    if(nextFlushedExpirationTime === NoWork || nextFlushedExpirationTime === Never) {
        currentSchedulerTime = currentRenderTime = msToExpirationTime(performance.now() - originalStartTimeMs);
    }
    return currentSchedulerTime;
}

function computeExpirationForFiber(currentTime, fiber) {
    let expirationTime = null;
    if(expirationContext !== NoWork) {
        // 当通过SyncUpdates把任务强制变成为最高优先级的时候走这里
        expirationTime = expirationContext;
    } else if(isWorking) {
        if(isCommitting) {
            // commit 阶段
            // 在提交阶段也就是全部的fiber都已经构建完成之后
            // 要把更新真实渲染到dom上去 这个过程是不能中断的
            // 所以要直接让他变成同步的
            expirationTime = Sync;
        } else {
            // render 阶段
                // 进入这里说明可能是刚才有个异步的任务被中断了
                // 然后现在要重新回来执行刚才那个被中断的任务
            expirationTime = nextRenderExpirationTime;
        }
    } else {
        // &是用来看这个mode上是否被添加过ConcurrentMode这个东西
        // 只有当给组件包裹了 <ConcurrentMode></ConcurrentMode> 的时候
        // 才会进入这个逻辑 表示该组件下的所有更新任务都要以低优先级的异步方式更新
        if(fiber.mode && ConcurrentMode) {
            // TODO 这逻辑先用不到 先不写
        } else {
            // 如果即不是异步也不批量也不是在正在更新fiber树的途中的话
            // 就直接让这个expirationTime变为同步的Sync
            expirationTime = Sync
        }
    }
    return expirationTime;
}
/*    --------更新任务队列相关------------   */
function createUpdate(expirationTime) {
    return {
        expirationTime, // 当前更新的优先级
        tag: UpdateState, // tag表示这个更新的类型
        payload: null, // 初次渲染时表示要更新的元素 执行setState时 它是传进来的新的state
        callback: null,
        next: null,
        nextEffect: null, // 下一个update对应的fiber
    }
}

function enqueueUpdate(fiber, update) {
    // TODO
    debugger;
}


class ReactRoot {
    constructor(container, isConcurrent) {
        this._internalRoot = this.createFiberRoot(container, isConcurrent);
    }

    createFiberRoot = (containerInfo, isConcurrent) =>  {
        // 会通过new FiberNode 返回一个RootFiber
        let uninitliazedFiber = this.createHostRootFiber(isConcurrent);
                
        // 初始化一个 FiberRoot
        // 这个FiberRoot 和 RootFiber 不是一个东西
        // 这个FiberRoot要作为RootFiber的实例也就是stateNode
        let root = {
            current: uninitliazedFiber, // 指向 RootFiber, 和下面的uninitliazedFiber.stateNode = root,一起循环引用
            containerInfo: containerInfo, // ReactDom.render 传进来的第二个参数即源生的容器
            pendingChildren: null, //暂时没啥用

            earliestPendingTime: NoWork, // 表示等待更新的任务的最高优先级
            latesPendingTime: NoWork, // 表示等待更新的任务中的最低优先级


            pendingCommitExpirationTime: NoWork, // 这个是等待提交阶段的优先级
            finishedWork: null, // 最终会生成的fiber树 也就是最终的workInProgress树
            context: null, // contextAPI相关
            pendingContext: null,

            // hydrate: hydrate // 服务端渲染相关
            nextExpirationTimeToWorkOn: NoWork,  // 异步更新时表示到这个时间之前都可以中断任务，一旦超过就不能中断了
            expirationTime: NoWork, // 当前fiber上如果有更新的话 那么这个属性就可以表示当前fiber的优先级
            nextScheduledRoot: null, // 下一个 root 节点 一个React可能有多个根节点
            // ... 其他看着没啥用的属性先不管了
        };

        uninitliazedFiber.stateNode = root;
        // 返回的 root 是要赋值给 legacyRenderSubtreeIntoContainer中的 root 和 container.__reactRootContainer
        // 让 container上可以指向RootFiber, 
        return root;
    }
    
    createHostRootFiber = (isConcurrent) => {
        // 第一次渲染肯定是false
        // 第一次的mode肯定是同步模式
        // react 源码中初次可能是4, 因为有个 enableProfilterTimer
        // 这个是给 devTools用的 咱们这里不用管
        let mode = isConcurrent ? ConcurrentMode : NoContext;

        return createFiber(HostRoot, null, null, mode);
    }

    updateContainer = (element, container, parentComponent, callback) => {
        // 这里在初次渲染的时候 element为children, container为 root, parentComponent为 null 
        let current = container.current; // FiberRoot
        let currentTime = requestCurrentTime();
        let expirationTime = computeExpirationForFiber(currentTime, current);
        this.scheduleRootUpdate(current, element, expirationTime, callback);
    }

    scheduleRootUpdate = (current, element, expirationTime, callback) => {
        let update = createUpdate(expirationTime);
        // payload应该是表示要更新的新的状态
        // 不过初次渲染的时候这个payload是根组件
        update.payload = { element };
        update.callback = callback;

        // enqueueUpdate是用来更新该fiber上的任务队列的
        // 初次渲染的时候即使要把根组件更新到RootFiber上
        enqueueUpdate(current, update);

    }

    render(children, callback) {
        let root = this._internalRoot;
        let work = new ReactWork();
        if(!!callback) {
            work.then(callback)
        };
        
        this.updateContainer(children, root, null, work._onCommit)
    }
}

class ReactWork {
    _callbacks = [];
    _didCommit = false;
    _onCommit = this._onCommit.bind(this);
    then(callback) {
        if(typeof callback === 'function') {
            this._callbacks.push(callback);
        };
    };
    _onCommit() {
        if(this._didCommit) return;
        this._callbacks.forEach((item) => {
            item();
        }) 
    }
}

const ReactDOM = {
    render: function(element, container, callback) { 
        // 初次渲染
        return legacyRenderSubtreeIntoContainer(null, element, container, false, callback);
    }
}

export default ReactDOM;