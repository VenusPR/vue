import renderAttrs from './modules/attrs'
import renderClass from './modules/class'
import renderStyle from './modules/style'
import show from './directives/show'
import { isUnaryTag } from 'web/util/index'

export function createComponentRenderer (options = {}) {
  const modules = Object.assign({
    attrs: renderAttrs,
    style: renderStyle,
    class: renderClass
  }, options.modules)

  const directives = Object.assign({
    show
  }, options.directives)

  function renderComponent (component) {
    component.$mount()
    return renderElement(component._vnode)
  }

  function renderNode (node) {
    return node.child
      ? renderComponent(node)
      : node.tag
        ? renderElement(node)
        : node.text
  }

  function renderElement (el) {
    const startTag = renderStartingTag(el)
    if (isUnaryTag(el.tag)) {
      return startTag
    } else {
      const children = el.children
        ? el.children.map(renderNode).join('')
        : ''
      return startTag + children + `</${el.tag}>`
    }
  }

  function renderStartingTag (node) {
    let markup = `<${node.tag}`
    if (node.data) {
      // check directives
      const dirs = node.data.directives
      if (dirs) {
        for (let i = 0; i < dirs.length; i++) {
          let dirRenderer = directives[dirs[i].name]
          if (dirRenderer) {
            // directives mutate the node's data
            // which then gets rendered by modules
            dirRenderer(node, dirs[i])
          }
        }
      }
      // apply other modules
      for (let key in node.data) {
        let renderer = modules[key]
        if (renderer) {
          markup += renderer(node)
        }
      }
    }
    return markup + '>'
  }

  return {
    renderToString (component) {
      return renderComponent(component)
    }
  }
}
