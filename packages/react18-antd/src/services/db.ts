import request from 'src/utils/request'
export enum QueryTypes {
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  BULKUPDATE = 'BULKUPDATE',
  BULKDELETE = 'BULKDELETE',
  DELETE = 'DELETE',
  UPSERT = 'UPSERT',
  VERSION = 'VERSION',
  SHOWTABLES = 'SHOWTABLES',
  SHOWINDEXES = 'SHOWINDEXES',
  DESCRIBE = 'DESCRIBE',
  RAW = 'RAW',
  FOREIGNKEYS = 'FOREIGNKEYS',
}
export type TableColumn = {
  type: string,
  allowNull: boolean,
  defaultValue: any,
  primaryKey: boolean,
  autoIncrement: boolean,
  comment: string|null
}
export type TableDescribe =Record<string,TableColumn>
export const query = async <T = any>(sql: string, type: QueryTypes) => {
  const res = await request.post<T>('/db/query', {
    sql,
    type: type
  })
  return res
}
export const select = async (sql: string) => {
  return await query(sql, QueryTypes.SELECT)
}
export const insert = async (sql: string) => {
  return await query(sql, QueryTypes.INSERT)
}
export const update = async (sql: string) => {
  return await query(sql, QueryTypes.UPDATE)
}
export const del = async (sql: string) => {
  return await query(sql, QueryTypes.DELETE)
}
export const connection = async (values: {
  database: string,
  username: string,
  password: string,
  host: string,
  port: number,
  type: 'mysql' | 'mssql' | 'sqlite' | 'oracle' | 'postgresql',
}) => {
  return await request.post('/db/connection', {
    database: values.database,
    username: values.username,
    password: values.password,
    host: values.host,
    port: values.port,
    type: values.type,
  })
}
export const isConnection = async () => {
  return await request.get<boolean>('/db/connectionState')
}

export const close = async () => {
  return await request.post('/db/close')
}

export const currentTables = async () => {
  return await query<string[]>(`SHOW TABLES`, QueryTypes.SHOWTABLES)
}
export const tables = async (database_name: string) => {
  return await query<string[]>(`SHOW TABLES FROM ${database_name}`, QueryTypes.SHOWTABLES)
}
export const tableDescribe = async (table_name: string) => {
  return await query<TableDescribe>(`DESCRIBE ${table_name}`, QueryTypes.DESCRIBE)
}