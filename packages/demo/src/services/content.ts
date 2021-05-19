import request from '@/utils/request';

export function getMagicCubeList(data: any) {
    return request('blisscake/backend/diyCustomPage/find', {
        method: 'POST',
        data: data,
    });
}

export function getMagicCubeDetail(data: any) {
    return request('blisscake/backend/diyCustomPage/detail', {
        method: 'GET',
        params: data,
    });
}
export function addMagicCube(data: any) {
    return request('blisscake/backend/diyCustomPage/add', {
        method: 'POST',
        data: data,
    });
}
export function updateMagicCube(data: any) {
    return request('blisscake/backend/diyCustomPage/update', {
        method: 'POST',
        data: data,
    });
}
export function deleteMagicCube(data: any) {
    return request('blisscake/backend/diyCustomPage/delete', {
        method: 'GET',
        params: data,
    });
}
export function updateMagicCubeStatus(data: any) {
    return request('blisscake/backend/diyCustomPage/updateStatus', {
        method: 'POST',
        data: data,
    });
}