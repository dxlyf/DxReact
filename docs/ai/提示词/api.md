设计一个 [业务实体] 列表查询API：
1. 接口路径：GET /api/[实体]
2. 查询参数：
   - page：页码
   - pageSize：每页条数
   - sortBy：排序字段
   - sortOrder：排序方式
   - keyword：搜索关键词
   - filter：[过滤条件]
3. 响应格式：
   {
     code: 200,
     data: {
       list: Array,
       total: Number,
       page: Number,
       pageSize: Number
     },
     message: "success"
   }
4. 错误码：[定义相关错误码]