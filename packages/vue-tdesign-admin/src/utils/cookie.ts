/**
 * Cookie工具对象 - 包含读取和写入方法
 */
const CookieUtil = {
    /**
     * 读取指定名称的cookie值
     * @param {string|string[]} names - cookie名称或名称数组
     * @returns {object|string|null} 如果传入字符串返回单个值，传入数组返回对象
     */
    read(names) {
        const allCookies = document.cookie.split('; ').reduce((acc, cookie) => {
            const [name, value] = cookie.split('=');
            if (name) {
                acc[name] = decodeURIComponent(value || '');
            }
            return acc;
        }, {});

        if (typeof names === 'string') {
            return allCookies[names] || null;
        }

        if (Array.isArray(names)) {
            const result = {};
            names.forEach(name => {
                result[name] = allCookies[name] || null;
            });
            return result;
        }

        // 如果未传参，返回所有cookie
        return allCookies;
    },

    /**
     * 写入单个或多个cookie
     * @param {string|object} name - cookie名称或包含名称-值的对象
     * @param {string} [value] - cookie值（当name为字符串时必填）
     * @param {object} [options] - 配置选项
     * @param {Date|string|number} [options.expires] - 过期时间，默认今天+1年
     * @param {string} [options.path='/'] - 路径
     * @param {string} [options.domain] - 域名
     * @param {boolean} [options.secure=false] - 是否仅HTTPS
     * @param {boolean} [options.sameSite] - SameSite属性
     * @returns {boolean} 是否写入成功
     */
    write(name, value, options = {}) {
        // 处理参数重载：支持传入对象
        if (typeof name === 'object') {
            const entries = Object.entries(name);
            let success = true;
            entries.forEach(([key, val]) => {
                const result = this.write(key, val, value); // value此时是options
                if (!result) success = false;
            });
            return success;
        }

        // 验证必填参数
        if (!name || value === undefined) {
            console.warn('Cookie写入失败：名称和值不能为空');
            return false;
        }

        // 构建cookie字符串
        let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        // 处理过期时间
        let expires = options.expires;
        if (expires === undefined) {
            // 默认：今天 + 1年
            const defaultExpiry = new Date();
            defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
            expires = defaultExpiry;
        }

        // 转换过期时间为GMT字符串
        let expiryDate;
        if (expires instanceof Date) {
            expiryDate = expires;
        } else if (typeof expires === 'number') {
            // 数字视为天数偏移
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + expires);
        } else if (typeof expires === 'string') {
            expiryDate = new Date(expires);
            if (isNaN(expiryDate.getTime())) {
                console.warn('Cookie写入失败：无效的过期时间格式');
                return false;
            }
        } else {
            console.warn('Cookie写入失败：不支持的过期时间类型');
            return false;
        }

        cookieStr += `; expires=${expiryDate.toUTCString()}`;

        // 添加路径
        cookieStr += `; path=${options.path || '/'}`;

        // 添加域名
        if (options.domain) {
            cookieStr += `; domain=${options.domain}`;
        }

        // 添加安全标志
        if (options.secure) {
            cookieStr += '; secure';
        }

        // 添加SameSite
        if (options.sameSite) {
            cookieStr += `; samesite=${options.sameSite}`;
        }

        // 写入cookie
        document.cookie = cookieStr;
        return true;
    },

    /**
     * 读取指定cookie并返回写入函数（组合方法）
     * @param {string[]} names - 需要读取的cookie名称数组
     * @param {object} [writeOptions] - 写入时的默认配置
     * @returns {Function} 返回一个函数，调用时可写入之前读取的所有cookie
     */
    readAndWrite(names, writeOptions = {}) {
        // 读取指定cookie
        const cookieData = this.read(names);
        
        // 如果传入的是单个字符串，转换为数组统一处理
        const nameArray = Array.isArray(names) ? names : [names];
        
        // 过滤掉不存在的cookie
        const existingCookies = {};
        nameArray.forEach(name => {
            if (cookieData[name] !== null && cookieData[name] !== undefined) {
                existingCookies[name] = cookieData[name];
            }
        });

        /**
         * 写入之前读取的cookie
         * @param {object} [overrideOptions] - 覆盖默认写入配置
         */
        return function writeCookies(overrideOptions = {}) {
            const mergedOptions = { ...writeOptions, ...overrideOptions };
            let success = true;
            
            Object.entries(existingCookies).forEach(([name, value]) => {
                const result = CookieUtil.write(name, value, mergedOptions);
                if (!result) success = false;
            });

            return success;
        };
    },

    /**
     * 删除指定cookie
     * @param {string|string[]} names - 要删除的cookie名称
     * @param {string} [path='/'] - 路径（需与写入时一致）
     * @param {string} [domain] - 域名（需与写入时一致）
     * @returns {boolean} 是否删除成功
     */
    remove(names, path = '/', domain) {
        const nameArray = Array.isArray(names) ? names : [names];
        let success = true;

        nameArray.forEach(name => {
            // 设置过期时间为过去时间
            const options = {
                expires: new Date(0),
                path: path
            };
            if (domain) options.domain = domain;
            
            const result = this.write(name, '', options);
            if (!result) success = false;
        });

        return success;
    }
};
