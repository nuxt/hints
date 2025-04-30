import MagicString from "magic-string"
import { createUnplugin } from "unplugin"

export const InjectHydrationPlugin = createUnplugin(() => {


    return {
        name: '@nuxt/hints:inject-hydration-check',
        transformInclude(id) {
            return id.endsWith('.vue') && !id.includes('node_modules')
        },
        transform(code, id) {

            const m = new MagicString(code)
            const re = /(<script.*?>[\s\S]*?<\/script>)/g
            const match = re.exec(code)
            if (!match) {
                return code
            }
            
            // add useHydrationCheck at the beginning of the script tag
            m.overwrite(match.index, match.index + match[0].length, `import { useHydrationCheck } from '@nuxt/hints/runtime/plugins/hydration'\nuseHydrationCheck()\n${match[0]}`)
            
            return {
                code: m.toString(),
                map: m.generateMap({ hires: true }),
            }
        }
    }
})