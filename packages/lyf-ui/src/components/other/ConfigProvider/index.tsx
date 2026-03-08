import React, { ReactNode, createContext, useContext } from 'react';
import './style/index.scss';

export interface Config {
  theme?: 'light' | 'dark';
  locale?: string;
  prefixCls?: string;
}

export interface ConfigProviderProps {
  config?: Config;
  children?: ReactNode;
}

const defaultConfig: Config = {
  theme: 'light',
  locale: 'zh-CN',
  prefixCls: 'lyf',
};

const ConfigContext = createContext<Config>(defaultConfig);

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  config = defaultConfig,
  children,
}) => {
  const mergedConfig = { ...defaultConfig, ...config };

  return (
    <ConfigContext.Provider value={mergedConfig}>
      <div className={`${mergedConfig.prefixCls}-config-provider ${mergedConfig.prefixCls}-theme-${mergedConfig.theme}`}>
        {children}
      </div>
    </ConfigContext.Provider>
  );
};

export default ConfigProvider;
