import { reactive, shallowReactive } from 'vue'

export class MapWithDefault<K, V> extends Map<K, V> {
  defaultValue: V
  constructor(defaultValue: () => V) {
    super()

    this.defaultValue = defaultValue()
  }

  override get(key: K): V {
    if (!super.has(key)) {
      super.set(key, this.defaultValue)
    }
    console.log('called')
    return super.get(key)!
  }
}

export function createGetWithDefault<K, V>(defaultValue: () => V) {
  const map = shallowReactive(new Map<K, V>())

  return {
    get(key: K): V {
      if (!map.has(key)) {
        map.set(key, defaultValue())
      }
      return map.get(key)!
    },
    entries() {
      return map.entries()
    }
  }
}
