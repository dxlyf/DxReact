
import img1 from '@/assets/images/magic-cube/1.png'
import img2 from '@/assets/images/magic-cube/2.png'
import img3 from '@/assets/images/magic-cube/3.png'
import img4 from '@/assets/images/magic-cube/4.png'
import img5 from '@/assets/images/magic-cube/5.png'
import img6 from '@/assets/images/magic-cube/6.png'
import img7 from '@/assets/images/magic-cube/7.png'
import img8 from '@/assets/images/magic-cube/8.png'

export const templates= [
  {
    type: 1,
    name: '1行2个',
    col: 2,
    bg: img1,
    data: [
      {
        left: 0,
        top: 0,
        width: 1
      },
      {
        left: 1,
        top: 0,
        width: 1
      }
    ]
  },
  {
    type: 2,
    name: '1行3个',
    col: 3,
    bg: img2,
    data: [
      {
        left: 0,
        top: 0,
        width: 1
      },
      {
        left: 1,
        top: 0,
        width: 1
      },
      {
        left: 2,
        top: 0,
        width: 1
      }
    ]
  },
  {
    type: 3,
    name: '1行4个',
    col: 4,
    bg: img3,
    data: [
      {
        left: 0,
        top: 0,
        width: 1
      },
      {
        left: 1,
        top: 0,
        width: 1
      },
      {
        left: 2,
        top: 0,
        width: 1
      },
      {
        left: 3,
        top: 0,
        width: 1
      }
    ]
  },
  {
    type: 4,
    name: '2左2右',
    col: 2,
    bg: img4,
    data: [
      {
        left: 0,
        top: 0,
        width: 1,
        height: 1
      },
      {
        left: 1,
        top: 0,
        width: 1,
        height: 1
      },
      {
        left: 0,
        top: 1,
        width: 1,
        height: 1
      },
      {
        left: 1,
        top: 1,
        width: 1,
        height: 1
      }
    ]
  },
  {
    type: 5,
    name: '1左2右',
    col: 2,
    bg: img5,
    data: [
      {
        left: 0,
        top: 0,
        width: 1,
        height: 2
      },
      {
        left: 1,
        top: 0,
        width: 1,
        height: 1
      },
      {
        left: 1,
        top: 1,
        width: 1,
        height: 1
      }
    ]
  },
  {
    type: 6,
    name: '1上2下',
    col: 2,
    bg: img6,
    data: [
      {
        left: 0,
        top: 0,
        width: 2,
        height: 1
      },
      {
        left: 0,
        top: 1,
        width: 1,
        height: 1
      },
      {
        left: 1,
        top: 1,
        width: 1,
        height: 1
      }
    ]
  },
  {
    type: 7,
    name: '1左3右',
    col: 2,
    bg:img7,
    data: [
      {
        left: 0,
        top: 0,
        width: 1,
        height: 2
      },
      {
        left: 1,
        top: 0,
        width: 1,
        height: 1
      },
      {
        left: 1,
        top: 1,
        width: 0.5,
        height: 1
      },
      {
        left: 1.5,
        top: 1,
        width: 0.5,
        height: 1
      }
    ]
  },
  {
    type: 'customize',
    name: '自定义',
    bg: img8
  }
]
