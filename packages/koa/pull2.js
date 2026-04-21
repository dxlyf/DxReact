const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

// 配置要下载的仓库列表
const repos = [
    { name: 'koa', repo: 'koajs/koa', branch: 'master' },
    { name: 'koa-router', repo: 'koajs/router', branch: 'master' },
    { name: 'koa-bodyparser', repo: 'koajs/bodyparser', branch: 'master' },
    { name: 'koa-static', repo: 'koajs/static', branch: 'master' },
    { name: 'koa-logger', repo: 'koajs/logger', branch: 'master' },
    { name: 'koa-session', repo: 'koajs/session', branch: 'master' },
    { name: 'koa-compress', repo: 'koajs/compress', branch: 'master' },
    { name: 'koa-mount', repo: 'koajs/mount', branch: 'master' }
];

// 目标根目录
const TARGET_DIR = path.join(process.cwd(), 'koa-sources');

// 确保目标目录存在
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

/**
 * 发送 HTTP/HTTPS 请求获取数据
 */
function request(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'Node.js Source Downloader',
                ...options.headers
            }
        };
        
        const req = protocol.request(requestOptions, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // 处理重定向
                const redirectUrl = new URL(res.headers.location, url).href;
                request(redirectUrl, options).then(resolve).catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                return;
            }
            
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

/**
 * 递归创建目录
 */
function mkdirRecursive(dirPath) {
    if (fs.existsSync(dirPath)) return;
    const parentDir = path.dirname(dirPath);
    if (parentDir !== dirPath) {
        mkdirRecursive(parentDir);
    }
    fs.mkdirSync(dirPath);
}

/**
 * 下载单个文件
 */
async function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            headers: {
                'User-Agent': 'Node.js Source Downloader'
            }
        };
        
        const req = protocol.request(options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                downloadFile(new URL(res.headers.location, url).href, filePath)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                return;
            }
            
            // 确保目录存在
            mkdirRecursive(path.dirname(filePath));
            
            const fileStream = fs.createWriteStream(filePath);
            
            // 处理 gzip 压缩
            if (res.headers['content-encoding'] === 'gzip') {
                const gunzip = zlib.createGunzip();
                pipeline(res, gunzip, fileStream, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                pipeline(res, fileStream, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            }
        });
        
        req.on('error', reject);
        req.end();
    });
}

/**
 * 通过 GitHub API 获取仓库的文件树
 */
async function getRepoTree(repo, branch, path = '') {
    const apiUrl = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`;
    
    const response = await request(apiUrl, {
        headers: {
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    const data = JSON.parse(response.toString());
    return data.tree || [];
}

/**
 * 从 GitHub 下载整个仓库（通过文件树逐个下载）
 */
async function downloadRepoByTree(repoConfig) {
    const { name, repo, branch } = repoConfig;
    const targetPath = path.join(TARGET_DIR, name);
    
    console.log(`开始下载 ${name} (通过 API)...`);
    
    try {
        // 获取仓库文件树
        const tree = await getRepoTree(repo, branch);
        
        // 过滤出文件（排除目录）
        const files = tree.filter(item => item.type === 'blob');
        
        let downloaded = 0;
        let failed = 0;
        
        // 逐个下载文件
        for (const file of files) {
            const filePath = path.join(targetPath, file.path);
            const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${file.path}`;
            
            try {
                await downloadFile(rawUrl, filePath);
                downloaded++;
                
                // 每10个文件打印一次进度
                if (downloaded % 10 === 0) {
                    console.log(`  📄 进度: ${downloaded}/${files.length}`);
                }
            } catch (err) {
                failed++;
                console.error(`  ❌ 下载失败: ${file.path} - ${err.message}`);
            }
        }
        
        console.log(`✅ ${name} 下载完成 (成功: ${downloaded}, 失败: ${failed})`);
        return { downloaded, failed };
    } catch (err) {
        console.error(`❌ ${name} 下载失败:`, err.message);
        throw err;
    }
}

/**
 * 下载 zip 包方式（更简单但需要解压能力）
 * 注意：这个方案需要解压，但为了保持原生，这里只下载不解压
 */
async function downloadZip(repoConfig) {
    const { name, repo, branch } = repoConfig;
    const zipUrl = `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;
    const zipPath = path.join(TARGET_DIR, `${name}.zip`);
    
    console.log(`开始下载 ${name}.zip...`);
    
    try {
        await downloadFile(zipUrl, zipPath);
        console.log(`✅ ${name}.zip 下载完成 -> ${zipPath}`);
        console.log(`   💡 提示: 如需解压，请使用 unzip 命令或解压软件`);
    } catch (err) {
        console.error(`❌ ${name}.zip 下载失败:`, err.message);
        throw err;
    }
}

/**
 * 下载单个文件或目录（通过 GitHub API 获取文件列表）
 */
async function downloadRepoTree(repoConfig) {
    const { name, repo, branch } = repoConfig;
    const apiUrl = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`;
    const targetPath = path.join(TARGET_DIR, name);
    
    console.log(`\n📦 下载 ${name}...`);
    console.log(`   仓库: ${repo}`);
    console.log(`   分支: ${branch}`);
    console.log(`   目标: ${targetPath}`);
    
    try {
        const response = await request(apiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Node.js-GitHub-Downloader'
            }
        });
        
        const data = JSON.parse(response.toString());
        const items = data.tree || [];
        
        let fileCount = 0;
        let dirCount = 0;
        
        for (const item of items) {
            const itemPath = path.join(targetPath, item.path);
            
            if (item.type === 'tree') {
                // 目录
                mkdirRecursive(itemPath);
                dirCount++;
            } else if (item.type === 'blob') {
                // 文件
                const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${item.path}`;
                try {
                    await downloadFile(rawUrl, itemPath);
                    fileCount++;
                    
                    if (fileCount % 20 === 0) {
                        process.stdout.write(`\r   下载进度: ${fileCount} 个文件`);
                    }
                } catch (err) {
                    console.error(`\n   ⚠️ 文件下载失败: ${item.path} - ${err.message}`);
                }
            }
        }
        
        console.log(`\n✅ ${name} 完成! (目录: ${dirCount}, 文件: ${fileCount})`);
        return { success: true, dirs: dirCount, files: fileCount };
    } catch (err) {
        console.error(`❌ ${name} 失败:`, err.message);
        return { success: false, error: err.message };
    }
}

/**
 * 主函数 - 下载所有仓库
 */
async function downloadAllRepos() {
    console.log('='.repeat(60));
    console.log('GitHub 仓库源码自动下载工具');
    console.log('='.repeat(60));
    console.log(`目标目录: ${TARGET_DIR}\n`);
    
    const results = [];
    
    for (const repo of repos) {
        const result = await downloadRepoTree(repo);
        results.push({ ...repo, ...result });
        // 添加延迟避免 API 限流
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 打印汇总
    console.log('\n' + '='.repeat(60));
    console.log('下载汇总:');
    console.log('='.repeat(60));
    
    for (const result of results) {
        const status = result.success ? '✅' : '❌';
        if (result.success) {
            console.log(`${status} ${result.name}: ${result.files} 个文件, ${result.dirs} 个目录`);
        } else {
            console.log(`${status} ${result.name}: ${result.error}`);
        }
    }
}

/**
 * 仅下载 zip 包的简单版本（不自动解压）
 */
async function downloadZipsOnly() {
    console.log('下载 zip 包模式...');
    console.log(`目标目录: ${TARGET_DIR}\n`);
    
    for (const repo of repos) {
        await downloadZip(repo);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✅ 所有 zip 包下载完成!');
    console.log('💡 使用以下命令解压:');
    console.log('   unzip koa.zip -d koa-sources/koa');
    console.log('   或使用解压软件手动解压');
}

// 选择执行模式
// 模式1: 下载完整源码（通过文件树逐个下载）- 推荐
downloadAllRepos();

// 模式2: 仅下载 zip 包（需要手动解压）
// downloadZipsOnly();