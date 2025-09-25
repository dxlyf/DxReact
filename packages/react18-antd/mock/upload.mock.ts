import { defineMock } from 'vite-plugin-mock-dev-server'
import * as fs from 'node:fs'
import {dirname,resolve,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir=resolve(__dirname,'../uploads')

interface File {
  /**
   * The size of the uploaded file in bytes. If the file is still being uploaded (see `'fileBegin'`
   * event), this property says how many bytes of the file have been written to disk yet.
   */
  size: number

  /**
   * The path this file is being written to. You can modify this in the `'fileBegin'` event in case
   * you are unhappy with the way formidable generates a temporary path for your files.
   */
  filepath: string

  /**
   * The name this file had according to the uploading client.
   */
  originalFilename: string | null

  /**
   * Calculated based on options provided
   */
  newFilename: string

  /**
   * The mime type of this file, according to the uploading client.
   */
  mimetype: string | null

  /**
   * A Date object (or `null`) containing the time this file was last written to. Mostly here for
   * compatibility with the [W3C File API Draft](http://dev.w3.org/2006/webapi/FileAPI/).
   */
  mtime?: Date | null | undefined

  hashAlgorithm: false | 'sha1' | 'md5' | 'sha256'

  /**
   * If `options.hashAlgorithm` calculation was set, you can read the hex digest out of this var
   * (at the end it will be a string).
   */
  hash?: string | null

  /**
   * This method returns a JSON-representation of the file, allowing you to JSON.stringify() the
   * file which is useful for logging and responding to requests.
   *
   * @link https://github.com/node-formidable/formidable#filetojson
   */
 // toJSON: () => FileJSON

  toString: () => string
}
export default defineMock({
  url: '/api/upload',
  method: 'POST',
  body(req) {
    const body = req.body
    
    // const files=body.files
    // if(files.length){
    //    // fs.writeFileSync(join(uploadDir,files[0].originalFilename),files[0])
    // }
    return {
       code:0,
       msg:'上传成功',
       data:{
         files: req.body?.files,//body.files.map((file: any) => file.originalFilename),
       }
    }
  },
})