
export interface ValidateResult {
    valid: boolean;
    message?: string;
}

// 从File对象获取图片尺寸
const getImageDimensionsFromFile = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.naturalWidth || img.width,
                    height: img.naturalHeight || img.height
                });
            };
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
    });
}

// 从URL获取图片尺寸
const getImageDimensionsFromUrl = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height
            });
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = url;
    });
}
export const getImageDimensions=async(file:File|string)=>{
    if(typeof file==='string'){
        return await getImageDimensionsFromUrl(file)
    }else{
        return await getImageDimensionsFromFile(file)
    }
}

// 校验尺寸是否符合要求
export const checkDimensions = (limit:{width?:number,height?:number},imageDimensions:{width:number,height:number}): ValidateResult => {
    if (limit.width !== undefined && imageDimensions.width !== limit.width) {
        return {
            valid: false,
            message: `图片宽度必须为 ${limit.width}px，当前宽度为 ${imageDimensions.width}px`
        };
    }
    if (limit.height !== undefined && imageDimensions.height !== limit.height) {
        return {
            valid: false,
            message: `图片高度必须为 ${limit.height}px，当前高度为 ${imageDimensions.height}px`
        };
    }
    return {
        valid: true,
    };
}

