import { genHandlers } from './events'
import { genDirectives } from './directives/index'
import { isReservedTag } from '../../runtime/util/dom'

export function generate (ast) {
  const code = ast ? genElement(ast) : '__h__("div")'
  return `with (this) { return ${code}}`
}

function genElement (el) {
  if (el.for) {
    return genFor(el)
  } else if (el.if) {
    return genIf(el)
  } else if (el.tag === 'template' && !el.attrsMap.slot) {
    return genChildren(el)
  } else if (el.tag === 'render') {
    return genRender(el)
  } else if (el.tag === 'slot') {
    return genSlot(el)
  } else {
    // if the element is potentially a component,
    // wrap its children as a thunk.
    const children = genChildren(el, !isReservedTag(el.tag))
    return `__h__('${el.tag}', ${genData(el)}, ${children})`
  }
}

function genIf (el) {
  const exp = el.if
  el.if = false // avoid recursion
  return `(${exp}) ? ${genElement(el)} : ${genElse(el)}`
}

function genElse (el) {
  return el.elseBlock
    ? genElement(el.elseBlock)
    : 'null'
}

function genFor (el) {
  const exp = el.for
  const alias = el.alias
  el.for = false // avoid recursion
  return `(${exp})&&(${exp}).map(function(${alias},$index) {return ${genElement(el)}})`
}

function genData (el) {
  if (el.plain) {
    return el.svg ? '{svg:true}' : '{}'
  }

  let data = '{'

  // directives first.
  // directives may mutate the el's other properties before they are generated.
  if (el.directives) {
    let dirs = genDirectives(el)
    if (dirs) data += dirs + ','
  }

  // svg
  if (el.svg) {
    data += 'svg:true,'
  }
  // key
  if (el.key) {
    data += `key:${el.key},`
  }
  // ref
  if (el.ref) {
    data += `ref:"${el.ref}",`
  }
  // slot names
  if (el.attrsMap.slot) {
    data += `slot:"${el.attrsMap.slot}",`
  }
  // class
  if (el.staticClass) {
    data += `staticClass:"${el.staticClass}",`
  }
  if (el.classBinding) {
    data += `class:${el.classBinding},`
  }
  // style
  if (el.styleBinding) {
    data += `style:${el.styleBinding},`
  }
  // props
  if (el.props) {
    data += `props:{${genProps(el.props)}},`
  }
  // attributes
  if (el.attrs) {
    data += `attrs:{${genProps(el.attrs)}}`
  }
  // hooks
  if (el.hooks) {
    data += `hook:{${genHooks(el.hooks)}},`
  }
  // event handlers
  if (el.events) {
    data += genHandlers(el.events)
  }
  return data.replace(/,$/, '') + '}'
}

function genChildren (el, asThunk) {
  if (!el.children.length) {
    return 'undefined'
  }
  const code = '[' + el.children.map(genNode).join(',') + ']'
  return asThunk
    ? `_renderWithContext(function(){return ${code}})`
    : code
}

function genNode (node) {
  if (node.tag) {
    return genElement(node)
  } else {
    return genText(node)
  }
}

function genText (text) {
  return text.expression
    ? `(${text.expression})`
    : JSON.stringify(text.text)
}

function genRender (el) {
  return `${el.method}(${el.args || 'null'},${genChildren(el)})`
}

function genSlot (el) {
  const name = el.name
    ? `"${el.name}"`
    : (el.dynamicName || '"default"')
  return `($slots[${name}] || ${genChildren(el)})`
}

function genProps (props) {
  let res = ''
  for (let i = 0; i < props.length; i++) {
    let prop = props[i]
    res += `"${prop.name}":${prop.value},`
  }
  return res.slice(0, -1)
}

function genHooks (hooks) {
  let res = ''
  for (let key in hooks) {
    res += `"${key}":${hooks[key]},`
  }
  return res.slice(0, -1)
}
