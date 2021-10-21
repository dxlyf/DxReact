import { IApi } from '@umijs/types';
export default (api: IApi) => {
    api.babelRegister.setOnlyMap({
        key:"ListGenerator",
        value:[require.resolve('./generates/ListGenerator')]
    })
    const createListGenerator=require('./generates/ListGenerator').default

    api.registerGenerator({
        key:"f",
        Generator:createListGenerator({api:api})
    })
}