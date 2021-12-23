const REACT_ELEMENT_TYPE = Symbol.for('react.element')



class Component {
    constructor() {

    };

    render() {

    }

}

function createElement(type, props={}, children) {
    let _props = Object.assign({}, props);
    let _key = _props.key || null;
    let _ref = _props.ref || null;  
    // 这边传入到 _props中的children 当只有一个children 不按照数组形式传
    _props.children = children.length === 0 ? null : children.length ===1 ? children[0] : children;

    return ReactElement(type, _key, _ref, _props);
}

function ReactElement(type, key, ref, props) {
    let element = {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref,
        props
    };
    return element;
}

const React = {
    createElement:  function(type, props, ...children) {
        let element = createElement(type, props, children);
        return element;
    },
    Component,
}

export  default React;