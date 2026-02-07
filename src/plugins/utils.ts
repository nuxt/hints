import type { CallExpression, ImportDeclaration, Program } from 'oxc-parser'
import { Visitor } from 'oxc-parser'

export function findDefineComponentCalls(program: Program): CallExpression[] | undefined {
  const imports = program.body.filter(
    (node): node is ImportDeclaration => node.type === 'ImportDeclaration',
  )
  const defineComponentImport = findImport('defineComponent', imports)

  const defineComponentNames = new Set<string>(['defineNuxtComponent'])

  // vue can do alias import for defineComponent
  if (defineComponentImport) {
    for (const specifier of defineComponentImport.specifiers) {
      if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier') {
        defineComponentNames.add(specifier.local.name)
      }
    }
  }

  const defineComponentNodes: CallExpression[] = []

  const visitor = new Visitor({
    CallExpression(node) {
      if (node.callee.type === 'Identifier' && defineComponentNames.has(node.callee.name)) {
        defineComponentNodes.push(node)
      }
    },
  })

  visitor.visit(program)

  return defineComponentNodes
}

export function findImport(name: string, imports: ImportDeclaration[]): ImportDeclaration | undefined {
  return imports.find((imp) => {
    return imp.specifiers.some((specifier) => {
      if (name === 'default' && specifier.type === 'ImportDefaultSpecifier') {
        return true
      }
      if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier') {
        return specifier.imported.name === name
      }
      return false
    })
  })
}
