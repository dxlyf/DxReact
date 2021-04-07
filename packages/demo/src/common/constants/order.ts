import {valuesKeyMap} from '@/utils/util'

export const ORDER_STATUS=valuesKeyMap([
    {
        value:0,
        text:"待付款",
    },
    {
        value:1,
        text:"付款确认中",
    },
    {
        value:10,
        text:"待发货"
    },
    {
        value:20,
        text:"已发货"
    },
    {
        value:30,
        text:"已完成"
    },
    {
        value:40,
        text:"已关闭"
    }
],"value")