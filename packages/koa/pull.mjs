import { execSync } from 'node:child_process'

import download  from 'download-git-repo';
import path from 'node:path';
import fs  from 'node:fs';

// 配置要下载的仓库列表
const repos = [
    { name: 'koa', repo: 'koajs/koa', branch: 'master' },
    { name: 'koa-router', repo: 'koajs/router', branch: 'master' },
    { name: 'koa-bodyparser', repo: 'koajs/bodyparser', branch: 'master' },
    { name: 'koa-static', repo: 'koajs/static', branch: 'master' },
    { name: 'koa-views', repo: 'queckezz/koa-views', branch: 'master' },
    { name: 'koa-logger', repo: 'koajs/logger', branch: 'master' },
    { name: 'koa-session', repo: 'koajs/session', branch: 'master' },
    { name: 'koa-cors', repo: 'evert0n/koa-cors', branch: 'master' },
    { name: 'koa-compress', repo: 'koajs/compress', branch: 'master' },
    { name: 'koa-mount', repo: 'koajs/mount', branch: 'master' }
];

// 目标根目录
const TARGET_DIR = path.join(process.cwd(), 'koa-sources');

// 确保目标目录存在
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// 下载单个仓库的Promise封装
function downloadRepo(repoConfig) {
    return new Promise((resolve, reject) => {
        const destPath = path.join(TARGET_DIR, repoConfig.name);
        const repoUrl = `${repoConfig.repo}#${repoConfig.branch}`;
        
        console.log(`开始下载 ${repoConfig.name}...`);
        
        download(repoUrl, destPath, { clone: false }, (err) => {
            if (err) {
                console.error(`下载 ${repoConfig.name} 失败:`, err.message);
                reject(err);
            } else {
                console.log(`✅ ${repoConfig.name} 下载完成 -> ${destPath}`);
                resolve();
            }
        });
    });
}

// 顺序下载所有仓库
async function downloadAll() {
    console.log(`目标目录: ${TARGET_DIR}\n`);
    
    for (const repo of repos) {
        await downloadRepo(repo);
    }
    
    console.log('\n🎉 所有仓库下载完成！');
}

// 执行下载
downloadAll().catch(console.error);