export default {
  'POST /api/product/getProductList': (req: any, res: any) => {
    res.json({
      success: true,
      code: 0,
      data: {
        total: 1,
        list: [
          {
            id: 1,
            productName: '芒果连连',
            skuName: '芒果连连',
            specName: '2磅',
            belong: '送',
            statusName: '已上架',
          },
        ],
      },
    });
  },
};
