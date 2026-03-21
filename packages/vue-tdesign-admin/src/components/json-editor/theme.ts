import { reactive } from 'vue'
import type { ThemeConfig } from './types'

const defaultTheme: ThemeConfig = {
  labelWidth: '100px',
  labelAlign: 'right',
  size: 'medium',
  showDescription: true,
  showRequiredMark: true,
  showValidation: true,
  collapsible: true,
  defaultExpanded: true
}

export class Theme {
  private config: ThemeConfig

  constructor(config: Partial<ThemeConfig> = {}) {
    this.config = reactive({ ...defaultTheme, ...config })
  }

  get<K extends keyof ThemeConfig>(key: K): ThemeConfig[K] {
    return this.config[key]
  }

  set<K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]): void {
    this.config[key] = value
  }

  getConfig(): ThemeConfig {
    return { ...this.config }
  }

  update(config: Partial<ThemeConfig>): void {
    Object.assign(this.config, config)
  }

  reset(): void {
    Object.assign(this.config, defaultTheme)
  }
}

export function createTheme(config?: Partial<ThemeConfig>): Theme {
  return new Theme(config)
}
