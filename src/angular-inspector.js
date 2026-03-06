const AngularInspector = (() => {
  function getNgContext(el) {
    const key = Object.keys(el).find((k) => k.startsWith("__ngContext__"));

    return key ? el[key] : null;
  }

  function getComponentName(el) {
    let node = el;

    while (node) {
      const ctx = getNgContext(node);

      if (ctx) {
        const instance = Array.isArray(ctx) ? ctx[8] : ctx;

        if (
          instance?.constructor?.name &&
          instance.constructor.name !== "Object"
        ) {
          return instance.constructor.name;
        }
      }

      const hostKey = Object.keys(node).find((k) => k.startsWith("__ngHost__"));

      if (hostKey) {
        const host = node[hostKey];

        if (host?.constructor?.name && host.constructor.name !== "Object") {
          return host.constructor.name;
        }
      }

      node = node.parentElement;
    }

    if (window.ng && typeof window.ng.getComponent === "function") {
      try {
        const comp = window.ng.getComponent(el);

        if (comp?.constructor) {
          return comp.constructor.name;
        }
      } catch (_) {}
    }

    return null;
  }

  function getAngularComponentHost(el) {
    let node = el;

    while (node) {
      if (
        node.attributes &&
        Array.from(node.attributes).some((a) => a.name.startsWith("_nghost-"))
      ) {
        return node;
      }

      node = node.parentElement;
    }

    return null;
  }

  function getSelectorFromHost(hostEl) {
    if (!hostEl) {
      return null;
    }

    const tag = hostEl.tagName.toLowerCase();
    const id = hostEl.id ? `#${hostEl.id}` : "";
    const classes = Array.from(hostEl.classList)
      .filter((c) => !isUtilityClass(c))
      .map((c) => `.${c}`)
      .join("");

    return `${tag}${id}${classes}`;
  }

  function isUtilityClass(c) {
    if (
      c.startsWith("ng-") ||
      c.startsWith("_ng") ||
      c.startsWith("__angular")
    ) {
      return true;
    }

    if (c.includes(":")) {
      return true;
    }

    const utilityPrefixes = [
      "flex",
      "grid",
      "block",
      "inline",
      "hidden",
      "overflow",
      "relative",
      "absolute",
      "fixed",
      "sticky",
      "static",
      "top",
      "bottom",
      "left",
      "right",
      "z-",
      "m-",
      "p-",
      "w-",
      "h-",
      "min-",
      "max-",
      "gap-",
      "space-",
      "text-",
      "font-",
      "leading-",
      "tracking-",
      "bg-",
      "border",
      "rounded",
      "shadow",
      "opacity-",
      "cursor-",
      "pointer-",
      "select-",
      "resize",
      "transition",
      "duration-",
      "ease-",
      "delay-",
      "animate-",
      "scale-",
      "rotate-",
      "translate-",
      "skew-",
      "origin-",
      "outline",
      "ring",
      "divide-",
      "place-",
      "justify-",
      "items-",
      "content-",
      "self-",
      "order-",
      "col-",
      "row-",
      "sr-",
      "aspect-",
      "object-",
      "inset-",
      "float-",
      "clear-",
      "break-",
      "box-",
      "table-",
      "caption-",
      "list-",
      "decoration-",
      "underline",
      "line-",
      "whitespace-",
      "truncate",
      "align-",
      "vertical-",
      "uppercase",
      "lowercase",
      "capitalize",
      "italic",
      "antialiased",
      "visible",
      "invisible",
      "fill-",
      "stroke-",
      "grow",
      "shrink",
      "basis-",
      "container",
      "mx-",
      "my-",
      "px-",
      "py-",
      "mt-",
      "mb-",
      "ml-",
      "mr-",
      "pt-",
      "pb-",
      "pl-",
      "pr-",
    ];

    return utilityPrefixes.some((prefix) => c.startsWith(prefix));
  }

  function buildCssPath(el, hostEl) {
    const parts = [];

    let node = el;

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      let selector = node.tagName.toLowerCase();

      if (node.id) {
        parts.unshift(`${selector}#${node.id}`);

        break;
      }

      const classes = Array.from(node.classList)
        .filter((c) => !isUtilityClass(c))
        .map((c) => `.${c}`)
        .join("");

      selector += classes;

      const parent = node.parentElement;

      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (c) => c.tagName === node.tagName,
        );

        if (siblings.length > 1) {
          selector += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        }
      }

      parts.unshift(selector);

      if (hostEl && node === hostEl) {
        break;
      }

      node = node.parentElement;
    }

    return parts.join(" > ");
  }

  function getRelevantAttributes(el) {
    const skip = new Set(["class", "style", "id"]);
    const attrs = {};

    for (let i = 0; i < el.attributes.length; i++) {
      const { name, value } = el.attributes[i];

      if (
        !skip.has(name) &&
        !name.startsWith("_ng") &&
        !name.startsWith("ng-reflect")
      ) {
        attrs[name] = value;
      }
    }

    return attrs;
  }

  function findTestSelector(el, hostEl) {
    const candidates = ["data-cy", "data-testid", "data-test"];

    let node = el;

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      for (const attr of candidates) {
        const val = node.getAttribute(attr);

        if (val) {
          return { attr, val };
        }
      }

      if (node === hostEl) {
        break;
      }

      node = node.parentElement;
    }

    return null;
  }

  function inspect(el) {
    const componentHost = getAngularComponentHost(el);
    const componentName = getComponentName(el);
    const hostSelector = getSelectorFromHost(componentHost);
    const cssPath = buildCssPath(el, componentHost);
    const testSelector = findTestSelector(el, componentHost);
    const attrs = getRelevantAttributes(el);
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim().slice(0, 60) || "";

    const attrString = Object.entries(attrs)
      .map(([k, v]) => (v ? `${k}="${v}"` : k))
      .join(" ");

    const openTag = attrString ? `<${tag} ${attrString}>` : `<${tag}>`;

    return {
      tag,
      text,
      openTag,
      componentName,
      hostSelector,
      cssPath,
      testSelector,
    };
  }

  function formatForClipboard(info) {
    const lines = [];

    if (info.componentName) {
      lines.push(`Component: ${info.componentName}`);
    }

    if (info.hostSelector) {
      lines.push(`Host: ${info.hostSelector}`);
    }

    lines.push(`Element: ${info.openTag}`);

    if (info.text) {
      lines.push(`Text: "${info.text}"`);
    }

    if (info.testSelector) {
      lines.push(
        `Selector: [${info.testSelector.attr}="${info.testSelector.val}"]`,
      );
    }

    lines.push(`CSS Path: ${info.cssPath}`);

    return lines.join("\n");
  }

  return { inspect, formatForClipboard };
})();
