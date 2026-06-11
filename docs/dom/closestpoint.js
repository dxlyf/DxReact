class BezierStrokeGeometryDetector {
    constructor(lineWidth = 10, lineCap = 'butt', lineJoin = 'miter', miterLimit = 10) {
        this.lineWidth = lineWidth;
        this.lineCap = lineCap;
        this.lineJoin = lineJoin;
        this.miterLimit = miterLimit;
        this.halfWidth = lineWidth / 2;
    }
    
    // 判断点是否在路径的描边上（支持贝塞尔曲线）
    isPointOnPath(commands, x, y) {
        if (commands.length === 0) return false;
        
        let currentPoint = null;
        let startPoint = null;
        
        // 1. 检查所有曲线段
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            
            switch (cmd.type) {
                case 'M': // moveTo
                    currentPoint = { x: cmd.x, y: cmd.y };
                    startPoint = { x: cmd.x, y: cmd.y };
                    break;
                    
                case 'L': // lineTo
                    if (currentPoint) {
                        if (this.isPointOnLineSegment(currentPoint, { x: cmd.x, y: cmd.y }, x, y)) {
                            return true;
                        }
                        currentPoint = { x: cmd.x, y: cmd.y };
                    }
                    break;
                    
                case 'Q': // quadraticCurveTo
                    if (currentPoint) {
                        if (this.isPointOnQuadraticBezier(currentPoint, 
                            { x: cmd.cp1x, y: cmd.cp1y }, 
                            { x: cmd.x, y: cmd.y }, x, y)) {
                            return true;
                        }
                        currentPoint = { x: cmd.x, y: cmd.y };
                    }
                    break;
                    
                case 'C': // bezierCurveTo
                    if (currentPoint) {
                        if (this.isPointOnCubicBezier(currentPoint,
                            { x: cmd.cp1x, y: cmd.cp1y },
                            { x: cmd.cp2x, y: cmd.cp2y },
                            { x: cmd.x, y: cmd.y }, x, y)) {
                            return true;
                        }
                        currentPoint = { x: cmd.x, y: cmd.y };
                    }
                    break;
                    
                case 'Z': // closePath
                    if (currentPoint && startPoint) {
                        if (this.isPointOnLineSegment(currentPoint, startPoint, x, y)) {
                            return true;
                        }
                        currentPoint = startPoint;
                    }
                    break;
            }
        }
        
        // 2. 检查连接点（如果路径是闭合的）
        if (this.isPathClosed(commands) && this.lineJoin !== 'butt') {
            if (this.checkAllJoins(commands, x, y)) {
                return true;
            }
        }
        
        // 3. 检查端点
        if (!this.isPathClosed(commands) && this.lineCap !== 'butt') {
            if (this.checkEndCaps(commands, x, y)) {
                return true;
            }
        }
        
        return false;
    }
    
    // ============ 贝塞尔曲线距离计算 ============
    
    // 点到二次贝塞尔曲线的最短距离
    isPointOnQuadraticBezier(p0, p1, p2, px, py) {
        // 使用二分法或牛顿迭代法求最近点
        const t = this.findClosestTOnQuadraticBezier(p0, p1, p2, px, py);
        const closestPoint = this.getQuadraticBezierPoint(p0, p1, p2, t);
        const distance = Math.hypot(px - closestPoint.x, py - closestPoint.y);
        
        if (distance <= this.halfWidth) {
            // 检查端点扩展（square cap）
            if (this.lineCap === 'square') {
                return this.checkCurveEndpointExtensions(p0, p2, px, py, t);
            }
            return true;
        }
        return false;
    }
    
    // 点到三次贝塞尔曲线的最短距离
    isPointOnCubicBezier(p0, p1, p2, p3, px, py) {
        const t = this.findClosestTOnCubicBezier(p0, p1, p2, p3, px, py);
        const closestPoint = this.getCubicBezierPoint(p0, p1, p2, p3, t);
        const distance = Math.hypot(px - closestPoint.x, py - closestPoint.y);
        
        if (distance <= this.halfWidth) {
            if (this.lineCap === 'square') {
                return this.checkCurveEndpointExtensions(p0, p3, px, py, t);
            }
            return true;
        }
        return false;
    }
    
    // 寻找二次贝塞尔曲线上最近点的 t 值
    findClosestTOnQuadraticBezier(p0, p1, p2, px, py) {
        // 使用黄金分割搜索或牛顿迭代
        // 简化版：采样+牛顿迭代
        
        // 1. 粗略采样找到最佳区间
        let bestT = 0;
        let bestDist = Infinity;
        
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const point = this.getQuadraticBezierPoint(p0, p1, p2, t);
            const dist = Math.hypot(px - point.x, py - point.y);
            if (dist < bestDist) {
                bestDist = dist;
                bestT = t;
            }
        }
        
        // 2. 牛顿迭代优化
        for (let iter = 0; iter < 5; iter++) {
            const point = this.getQuadraticBezierPoint(p0, p1, p2, bestT);
            const derivative = this.getQuadraticBezierDerivative(p0, p1, p2, bestT);
            const secondDerivative = this.getQuadraticBezierSecondDerivative(p0, p1, p2);
            
            const diff = { x: px - point.x, y: py - point.y };
            const numerator = diff.x * derivative.x + diff.y * derivative.y;
            const denominator = derivative.x * derivative.x + derivative.y * derivative.y + 
                               (diff.x * secondDerivative.x + diff.y * secondDerivative.y);
            
            if (denominator !== 0) {
                let newT = bestT + numerator / denominator;
                newT = Math.max(0, Math.min(1, newT));
                if (Math.abs(newT - bestT) < 1e-6) break;
                bestT = newT;
            }
        }
        
        return Math.max(0, Math.min(1, bestT));
    }
    
    // 寻找三次贝塞尔曲线上最近点的 t 值
    findClosestTOnCubicBezier(p0, p1, p2, p3, px, py) {
        // 使用自适应采样方法
        let bestT = 0;
        let bestDist = Infinity;
        
        // 1. 递归细分方法
        const segments = [{ t0: 0, t1: 1 }];
        
        while (segments.length > 0) {
            const { t0, t1 } = segments.pop();
            
            // 采样中点
            const tm = (t0 + t1) / 2;
            const p0p = this.getCubicBezierPoint(p0, p1, p2, p3, t0);
            const pmp = this.getCubicBezierPoint(p0, p1, p2, p3, tm);
            const p1p = this.getCubicBezierPoint(p0, p1, p2, p3, t1);
            
            // 检查曲线的平坦度
            const chordLength = Math.hypot(p1p.x - p0p.x, p1p.y - p0p.y);
            const curveLength = Math.hypot(pmp.x - p0p.x, pmp.y - p0p.y) + 
                               Math.hypot(p1p.x - pmp.x, p1p.y - pmp.y);
            
            if (curveLength - chordLength < 0.1) { // 足够平坦
                // 线性插值找到最近点
                const dist0 = Math.hypot(px - p0p.x, py - p0p.y);
                const dist1 = Math.hypot(px - p1p.x, py - p1p.y);
                
                if (dist0 < bestDist) {
                    bestDist = dist0;
                    bestT = t0;
                }
                if (dist1 < bestDist) {
                    bestDist = dist1;
                    bestT = t1;
                }
            } else {
                // 继续细分
                segments.push({ t0: t0, t1: tm });
                segments.push({ t0: tm, t1: t1 });
            }
        }
        
        // 2. 牛顿迭代精调
        for (let iter = 0; iter < 5; iter++) {
            const point = this.getCubicBezierPoint(p0, p1, p2, p3, bestT);
            const derivative = this.getCubicBezierDerivative(p0, p1, p2, p3, bestT);
            const secondDerivative = this.getCubicBezierSecondDerivative(p0, p1, p2, p3, bestT);
            
            const diff = { x: px - point.x, y: py - point.y };
            const numerator = diff.x * derivative.x + diff.y * derivative.y;
            const denominator = derivative.x * derivative.x + derivative.y * derivative.y + 
                               (diff.x * secondDerivative.x + diff.y * secondDerivative.y);
            
            if (denominator !== 0) {
                let newT = bestT + numerator / denominator;
                newT = Math.max(0, Math.min(1, newT));
                if (Math.abs(newT - bestT) < 1e-6) break;
                bestT = newT;
            }
        }
        
        return bestT;
    }
    
    // ============ 贝塞尔曲线计算函数 ============
    
    getQuadraticBezierPoint(p0, p1, p2, t) {
        const mt = 1 - t;
        return {
            x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
            y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
        };
    }
    
    getQuadraticBezierDerivative(p0, p1, p2, t) {
        return {
            x: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
            y: 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
        };
    }
    
    getQuadraticBezierSecondDerivative(p0, p1, p2) {
        return {
            x: 2 * (p2.x - 2 * p1.x + p0.x),
            y: 2 * (p2.y - 2 * p1.y + p0.y)
        };
    }
    
    getCubicBezierPoint(p0, p1, p2, p3, t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;
        return {
            x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
            y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
        };
    }
    
    getCubicBezierDerivative(p0, p1, p2, p3, t) {
        const mt = 1 - t;
        return {
            x: 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
            y: 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
        };
    }
    
    getCubicBezierSecondDerivative(p0, p1, p2, p3, t) {
        return {
            x: 6 * (1 - t) * (p2.x - 2 * p1.x + p0.x) + 6 * t * (p3.x - 2 * p2.x + p1.x),
            y: 6 * (1 - t) * (p2.y - 2 * p1.y + p0.y) + 6 * t * (p3.y - 2 * p2.y + p1.y)
        };
    }
    
    // ============ 直线段相关函数 ============
    
    isPointOnLineSegment(p1, p2, x, y) {
        const distance = this.pointToSegmentDistance(p1, p2, x, y);
        
        if (distance <= this.halfWidth) {
            if (this.lineCap === 'square') {
                return this.isPointInSquareCap(p1, p2, x, y);
            }
            return true;
        }
        return false;
    }
    
    pointToSegmentDistance(p1, p2, px, py) {
        const ax = p2.x - p1.x;
        const ay = p2.y - p1.y;
        const len2 = ax * ax + ay * ay;
        
        if (len2 === 0) return Math.hypot(px - p1.x, py - p1.y);
        
        let t = ((px - p1.x) * ax + (py - p1.y) * ay) / len2;
        t = Math.max(0, Math.min(1, t));
        
        const nearestX = p1.x + t * ax;
        const nearestY = p1.y + t * ay;
        
        return Math.hypot(px - nearestX, py - nearestY);
    }
    
    // ============ 连接点和端点处理 ============
    
    isPathClosed(commands) {
        if (commands.length < 2) return false;
        // 检查是否有 closePath 命令
        return commands.some(cmd => cmd.type === 'Z');
    }
    
    checkAllJoins(commands, x, y) {
        // 收集所有连接点
        const points = this.extractAllPoints(commands);
        
        for (let i = 1; i < points.length - 1; i++) {
            if (this.isPointOnJoin(points[i - 1], points[i], points[i + 1], x, y)) {
                return true;
            }
        }
        
        // 检查首尾连接
        if (points.length >= 3) {
            if (this.isPointOnJoin(points[points.length - 1], points[0], points[1], x, y)) {
                return true;
            }
        }
        
        return false;
    }
    
    checkEndCaps(commands, x, y) {
        const points = this.extractAllPoints(commands);
        if (points.length < 2) return false;
        
        // 起点端点
        if (this.isPointOnCap(points[0], points[1], x, y, true)) {
            return true;
        }
        
        // 终点端点
        const lastIdx = points.length - 1;
        if (this.isPointOnCap(points[lastIdx], points[lastIdx - 1], x, y, false)) {
            return true;
        }
        
        return false;
    }
    
    extractAllPoints(commands) {
        const points = [];
        let currentPoint = null;
        
        for (const cmd of commands) {
            switch (cmd.type) {
                case 'M':
                case 'L':
                    currentPoint = { x: cmd.x, y: cmd.y };
                    points.push(currentPoint);
                    break;
                case 'Q':
                case 'C':
                    currentPoint = { x: cmd.x, y: cmd.y };
                    points.push(currentPoint);
                    break;
                case 'Z':
                    if (points.length > 0) {
                        points.push(points[0]);
                    }
                    break;
            }
        }
        
        return points;
    }
    
    // 连接点检测（复用之前的实现）
    isPointOnJoin(p1, p2, p3, x, y) {
        const angle = this.getAngle(p1, p2, p3);
        
        switch (this.lineJoin) {
            case 'round':
                return Math.hypot(x - p2.x, y - p2.y) <= this.halfWidth;
            case 'bevel':
                return this.isPointInBevelJoin(p1, p2, p3, x, y);
            case 'miter':
                return this.isPointInMiterJoin(p1, p2, p3, x, y);
            default:
                return false;
        }
    }
    
    isPointOnCap(p1, p2, x, y, isStart) {
        const distance = Math.hypot(x - p1.x, y - p1.y);
        
        switch (this.lineCap) {
            case 'round':
                return distance <= this.halfWidth;
            case 'square':
                return this.isPointInSquareCap(p1, p2, x, y);
            default:
                return false;
        }
    }
    
    // 辅助几何函数
    getAngle(p1, p2, p3) {
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.hypot(v1.x, v1.y);
        const mag2 = Math.hypot(v2.x, v2.y);
        return Math.acos(Math.min(1, Math.max(-1, dot / (mag1 * mag2))));
    }
    
    isPointInBevelJoin(p1, p2, p3, x, y) {
        const v1 = this.normalize(p1.x - p2.x, p1.y - p2.y);
        const v2 = this.normalize(p3.x - p2.x, p3.y - p2.y);
        
        const offset1 = {
            x: p2.x - v1.y * this.halfWidth,
            y: p2.y + v1.x * this.halfWidth
        };
        const offset2 = {
            x: p2.x - v2.y * this.halfWidth,
            y: p2.y + v2.x * this.halfWidth
        };
        
        return this.isPointInTriangle(x, y, p2, offset1, offset2);
    }
    
    isPointInMiterJoin(p1, p2, p3, x, y) {
        const angle = this.getAngle(p1, p2, p3);
        const miterLength = this.halfWidth / Math.sin(angle / 2);
        
        if (miterLength > this.halfWidth * this.miterLimit) {
            return this.isPointInBevelJoin(p1, p2, p3, x, y);
        }
        
        const v1 = this.normalize(p1.x - p2.x, p1.y - p2.y);
        const v2 = this.normalize(p3.x - p2.x, p3.y - p2.y);
        const bisector = this.normalize(v1.x + v2.x, v1.y + v2.y);
        
        const miterPoint = {
            x: p2.x + bisector.x * miterLength,
            y: p2.y + bisector.y * miterLength
        };
        
        const perp1 = { x: -v1.y, y: v1.x };
        const perp2 = { x: -v2.y, y: v2.x };
        
        const p1Offset = { x: p2.x + perp1.x * this.halfWidth, y: p2.y + perp1.y * this.halfWidth };
        const p2Offset = { x: p2.x - perp1.x * this.halfWidth, y: p2.y - perp1.y * this.halfWidth };
        const p3Offset = { x: p2.x + perp2.x * this.halfWidth, y: p2.y + perp2.y * this.halfWidth };
        const p4Offset = { x: p2.x - perp2.x * this.halfWidth, y: p2.y - perp2.y * this.halfWidth };
        
        return this.isPointInQuadrilateral(x, y, p1Offset, miterPoint, p3Offset, p2Offset);
    }
    
    isPointInSquareCap(p1, p2, x, y) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        
        if (len === 0) return Math.hypot(x - p1.x, y - p1.y) <= this.halfWidth;
        
        const ux = dx / len;
        const uy = dy / len;
        const vx = -uy;
        const vy = ux;
        
        const rect = [
            { x: p1.x + vx * this.halfWidth, y: p1.y + vy * this.halfWidth },
            { x: p1.x - vx * this.halfWidth, y: p1.y - vy * this.halfWidth },
            { x: p1.x - vx * this.halfWidth + ux * this.halfWidth, y: p1.y - vy * this.halfWidth + uy * this.halfWidth },
            { x: p1.x + vx * this.halfWidth + ux * this.halfWidth, y: p1.y + vy * this.halfWidth + uy * this.halfWidth }
        ];
        
        return this.isPointInQuadrilateral(x, y, rect[0], rect[1], rect[2], rect[3]);
    }
    
    checkCurveEndpointExtensions(p0, p1, px, py, t) {
        // 检查曲线端点是否需要 square cap 扩展
        if (t <= 0.01) {
            return this.isPointInSquareCap(p0, p1, px, py);
        }
        if (t >= 0.99) {
            return this.isPointInSquareCap(p1, p0, px, py);
        }
        return true;
    }
    
    normalize(x, y) {
        const len = Math.hypot(x, y);
        if (len === 0) return { x: 0, y: 0 };
        return { x: x / len, y: y / len };
    }
    
    isPointInTriangle(px, py, a, b, c) {
        const sign1 = this.sign(px, py, a, b);
        const sign2 = this.sign(px, py, b, c);
        const sign3 = this.sign(px, py, c, a);
        
        const hasNeg = (sign1 < 0) || (sign2 < 0) || (sign3 < 0);
        const hasPos = (sign1 > 0) || (sign2 > 0) || (sign3 > 0);
        
        return !(hasNeg && hasPos);
    }
    
    isPointInQuadrilateral(px, py, a, b, c, d) {
        return this.isPointInTriangle(px, py, a, b, c) || 
               this.isPointInTriangle(px, py, a, c, d);
    }
    
    sign(px, py, a, b) {
        return (px - b.x) * (a.y - b.y) - (a.x - b.x) * (py - b.y);
    }
}

// ============ 使用示例 ============

// 创建路径命令
const commands = [
    { type: 'M', x: 100, y: 100 },
    { type: 'Q', cp1x: 150, cp1y: 50, x: 200, y: 100 },  // 二次贝塞尔
    { type: 'C', cp1x: 250, cp1y: 150, cp2x: 150, cp2y: 200, x: 200, y: 200 }, // 三次贝塞尔
    { type: 'L', x: 100, y: 200 },
    { type: 'Z' }  // 闭合路径
];

const detector = new BezierStrokeGeometryDetector(
    15,           // lineWidth
    'round',      // lineCap
    'round'       // lineJoin
);

// 测试点
const testPoints = [
    { x: 150, y: 90 },   // 在二次贝塞尔曲线上
    { x: 175, y: 175 },  // 在三次贝塞尔曲线上  
    { x: 100, y: 100 },  // 起点
    { x: 50, y: 50 }     // 外部点
];

testPoints.forEach(point => {
    const isOnStroke = detector.isPointOnPath(commands, point.x, point.y);
    console.log(`点 (${point.x}, ${point.y}): ${isOnStroke ? '在' : '不在'}描边上`);
});