import { builderStore } from "stores"

/**
 * Helper to build a CSS string from a style object.
 */
const buildStyleString = (styleObject, customStyles) => {
  let str = ""
  Object.entries(styleObject || {}).forEach(([style, value]) => {
    if (style && value != null) {
      str += `${style}: ${value}; `
    }
  })
  return str + (customStyles || "")
}

/**
 * Svelte action to apply correct component styles.
 * This also applies handlers for selecting components from the builder preview.
 */
export const styleable = (node, styles = {}) => {
  let applyNormalStyles
  let applyHoverStyles
  let selectComponent

  // Allow dragging if required
  const parent = node.closest(".component")
  if (parent && parent.classList.contains("draggable")) {
    node.setAttribute("draggable", true)
  }

  // Creates event listeners and applies initial styles
  const setupStyles = (newStyles = {}) => {
    let baseStyles = {}
    if (newStyles.empty) {
      baseStyles.border = "2px dashed var(--spectrum-global-color-gray-600)"
      baseStyles.padding = "var(--spacing-l)"
      baseStyles.overflow = "hidden"
    }

    const componentId = newStyles.id
    const customStyles = newStyles.custom || ""
    const normalStyles = { ...baseStyles, ...newStyles.normal }
    const hoverStyles = {
      ...normalStyles,
      ...(newStyles.hover || {}),
    }

    // Applies a style string to a DOM node
    const applyStyles = styleString => {
      node.style = styleString
    }

    // Applies the "normal" style definition
    applyNormalStyles = () => {
      applyStyles(buildStyleString(normalStyles, customStyles))
    }

    // Applies any "hover" styles as well as the base "normal" styles
    applyHoverStyles = () => {
      applyStyles(buildStyleString(hoverStyles, customStyles))
    }

    // Handler to select a component in the builder when clicking it in the
    // builder preview
    selectComponent = event => {
      builderStore.actions.selectComponent(componentId)
      event.preventDefault()
      event.stopPropagation()
      return false
    }

    // Add listeners to toggle hover styles
    node.addEventListener("mouseover", applyHoverStyles)
    node.addEventListener("mouseout", applyNormalStyles)

    // Add builder preview click listener
    if (newStyles.interactive) {
      node.addEventListener("click", selectComponent, false)
    }

    // Apply initial normal styles
    applyNormalStyles()
  }

  // Removes the current event listeners
  const removeListeners = () => {
    node.removeEventListener("mouseover", applyHoverStyles)
    node.removeEventListener("mouseout", applyNormalStyles)
    node.removeEventListener("click", selectComponent)
  }

  // Apply initial styles
  setupStyles(styles)

  return {
    // Clean up old listeners and apply new ones on update
    update: newStyles => {
      removeListeners()
      setupStyles(newStyles)
    },
    // Clean up listeners when component is destroyed
    destroy: () => {
      removeListeners()
    },
  }
}
