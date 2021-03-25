import React, { useMemo, useState,useEffect} from 'react'
import app from '@/utils/app'

interface ImageProps {
    src: string
}

export let ImageView: React.FC<ImageProps> = ({src, ...restProps }) => {
    let imgUrl = useMemo(() => {
        return app.toImageUrl(src)
    }, [src])
    return <img src={imgUrl} />
}