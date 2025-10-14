我来用JavaScript实现这些经典的字符串/序列算法，并提供多种解法。

## 1. 最长递增子序列 (LIS)

### 方法1: 动态规划 O(n²)
```javascript
function lisDP(nums) {
    if (!nums || nums.length === 0) return 0;
    
    const n = nums.length;
    const dp = new Array(n).fill(1); // dp[i] 表示以nums[i]结尾的LIS长度
    let maxLen = 1;
    
    for (let i = 1; i < n; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[i] > nums[j]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        maxLen = Math.max(maxLen, dp[i]);
    }
    
    return maxLen;
}

// 获取具体的LIS序列
function getLISSequence(nums) {
    if (!nums || nums.length === 0) return [];
    
    const n = nums.length;
    const dp = new Array(n).fill(1);
    const prev = new Array(n).fill(-1);
    
    for (let i = 1; i < n; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[i] > nums[j] && dp[j] + 1 > dp[i]) {
                dp[i] = dp[j] + 1;
                prev[i] = j;
            }
        }
    }
    
    // 找到最长序列的结束位置
    let maxIndex = 0;
    for (let i = 1; i < n; i++) {
        if (dp[i] > dp[maxIndex]) maxIndex = i;
    }
    
    // 重建序列
    const result = [];
    let current = maxIndex;
    while (current !== -1) {
        result.unshift(nums[current]);
        current = prev[current];
    }
    
    return result;
}
```

### 方法2: 贪心 + 二分查找 O(n log n)
```javascript
function lisGreedy(nums) {
    if (!nums || nums.length === 0) return 0;
    
    const tails = []; // tails[i] 存储长度为i+1的递增子序列的最小末尾值
    tails.push(nums[0]);
    
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] > tails[tails.length - 1]) {
            // 比所有末尾值都大，直接追加
            tails.push(nums[i]);
        } else {
            // 二分查找替换位置
            let left = 0, right = tails.length - 1;
            while (left < right) {
                const mid = Math.floor((left + right) / 2);
                if (tails[mid] < nums[i]) {
                    left = mid + 1;
                } else {
                    right = mid;
                }
            }
            tails[left] = nums[i];
        }
    }
    
    return tails.length;
}

// 获取具体的LIS序列（优化版本）
function getLISGreedySequence(nums) {
    if (!nums || nums.length === 0) return [];
    
    const tails = [nums[0]];
    const indices = [0]; // 记录每个位置在tails中的索引
    const prev = new Array(nums.length).fill(-1);
    
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] > tails[tails.length - 1]) {
            prev[i] = indices[indices.length - 1];
            tails.push(nums[i]);
            indices.push(i);
        } else {
            let left = 0, right = tails.length - 1;
            while (left < right) {
                const mid = Math.floor((left + right) / 2);
                if (tails[mid] < nums[i]) {
                    left = mid + 1;
                } else {
                    right = mid;
                }
            }
            tails[left] = nums[i];
            indices[left] = i;
            prev[i] = left > 0 ? indices[left - 1] : -1;
        }
    }
    
    // 重建序列
    const result = [];
    let current = indices[indices.length - 1];
    while (current !== -1) {
        result.unshift(nums[current]);
        current = prev[current];
    }
    
    return result;
}
```

## 2. 最长公共子序列 (LCS)

### 方法1: 经典动态规划
```javascript
function lcs(text1, text2) {
    const m = text1.length, n = text2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    return dp[m][n];
}

// 获取具体的LCS序列
function getLCSSequence(text1, text2) {
    const m = text1.length, n = text2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    
    // 构建DP表
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    // 回溯构建序列
    let i = m, j = n;
    const result = [];
    
    while (i > 0 && j > 0) {
        if (text1[i - 1] === text2[j - 1]) {
            result.unshift(text1[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    
    return result.join('');
}
```

### 方法2: 空间优化DP
```javascript
function lcsOptimized(text1, text2) {
    const m = text1.length, n = text2.length;
    if (m < n) return lcsOptimized(text2, text1); // 让较短的作为text2
    
    let prev = new Array(n + 1).fill(0);
    let curr = new Array(n + 1).fill(0);
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                curr[j] = prev[j - 1] + 1;
            } else {
                curr[j] = Math.max(prev[j], curr[j - 1]);
            }
        }
        [prev, curr] = [curr, prev]; // 交换引用
    }
    
    return prev[n];
}
```

## 3. 最长公共子串

### 方法1: 动态规划
```javascript
function longestCommonSubstring(text1, text2) {
    const m = text1.length, n = text2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    let maxLen = 0;
    let endPos = 0; // 在text1中的结束位置
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
                if (dp[i][j] > maxLen) {
                    maxLen = dp[i][j];
                    endPos = i - 1;
                }
            } else {
                dp[i][j] = 0; // 子串要求连续，不相等就重置
            }
        }
    }
    
    return {
        length: maxLen,
        substring: text1.substring(endPos - maxLen + 1, endPos + 1)
    };
}
```

### 方法2: 滑动窗口
```javascript
function longestCommonSubstringSliding(text1, text2) {
    if (!text1 || !text2) return { length: 0, substring: '' };
    
    let maxLen = 0;
    let result = '';
    
    // 尝试所有可能的对齐方式
    for (let i = 0; i < text1.length; i++) {
        for (let j = 0; j < text2.length; j++) {
            let k = 0;
            while (i + k < text1.length && 
                   j + k < text2.length && 
                   text1[i + k] === text2[j + k]) {
                k++;
            }
            
            if (k > maxLen) {
                maxLen = k;
                result = text1.substring(i, i + k);
            }
        }
    }
    
    return { length: maxLen, substring: result };
}
```

### 方法3: 后缀数组方法（更高效）
```javascript
function longestCommonSubstringSuffix(text1, text2) {
    const combined = text1 + '#' + text2 + '$'; // 使用特殊字符分隔
    const suffixes = [];
    
    // 生成所有后缀
    for (let i = 0; i < combined.length; i++) {
        suffixes.push({
            index: i,
            suffix: combined.substring(i)
        });
    }
    
    // 按字典序排序后缀
    suffixes.sort((a, b) => a.suffix.localeCompare(b.suffix));
    
    let maxLen = 0;
    let result = '';
    
    // 比较相邻后缀
    for (let i = 1; i < suffixes.length; i++) {
        const prev = suffixes[i - 1];
        const curr = suffixes[i];
        
        // 确保两个后缀来自不同的字符串
        const isFromDifferentStrings = 
            (prev.index <= text1.length && curr.index > text1.length) ||
            (curr.index <= text1.length && prev.index > text1.length);
        
        if (isFromDifferentStrings) {
            let commonLen = 0;
            while (commonLen < prev.suffix.length && 
                   commonLen < curr.suffix.length &&
                   prev.suffix[commonLen] === curr.suffix[commonLen]) {
                commonLen++;
            }
            
            if (commonLen > maxLen) {
                maxLen = commonLen;
                result = prev.suffix.substring(0, commonLen);
            }
        }
    }
    
    return { length: maxLen, substring: result };
}
```

## 测试代码
```javascript
// 测试用例
console.log('=== 最长递增子序列测试 ===');
const nums = [10, 9, 2, 5, 3, 7, 101, 18];
console.log('DP方法长度:', lisDP(nums));
console.log('贪心方法长度:', lisGreedy(nums));
console.log('LIS序列:', getLISGreedySequence(nums));

console.log('\n=== 最长公共子序列测试 ===');
const text1 = "ABCDGH", text2 = "AEDFHR";
console.log('LCS长度:', lcs(text1, text2));
console.log('LCS序列:', getLCSSequence(text1, text2));
console.log('优化LCS长度:', lcsOptimized(text1, text2));

console.log('\n=== 最长公共子串测试 ===');
const str1 = "ABABC", str2 = "BABCA";
console.log('DP方法:', longestCommonSubstring(str1, str2));
console.log('滑动窗口:', longestCommonSubstringSliding(str1, str2));
console.log('后缀数组:', longestCommonSubstringSuffix(str1, str2));
```

## 算法复杂度总结

| 算法 | 方法 | 时间复杂度 | 空间复杂度 |
|------|------|------------|------------|
| LIS | 动态规划 | O(n²) | O(n) |
| LIS | 贪心+二分 | O(n log n) | O(n) |
| LCS | 经典DP | O(mn) | O(mn) |
| LCS | 优化DP | O(mn) | O(min(m,n)) |
| 最长公共子串 | 动态规划 | O(mn) | O(mn) |
| 最长公共子串 | 滑动窗口 | O(mn×L) | O(1) |
| 最长公共子串 | 后缀数组 | O(n log n) | O(n) |

这些实现涵盖了从基础到优化的各种方法，你可以根据具体需求选择合适的算法。