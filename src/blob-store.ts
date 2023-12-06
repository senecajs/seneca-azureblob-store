/* Copyright (c) 2023 Richard Rodger, MIT License */

import Path from 'path'
import Fsp from 'fs/promises'

import { Default, Skip, Any, Exact, Child, Empty } from 'gubu'

import {
  DefaultAzureCredential
} from "@azure/identity"

import {
  BlobServiceClient,
  StorageSharedKeyCredential
} from '@azure/storage-blob'

blob_store.defaults = {
  prefix: Empty('seneca/db01/'),
  suffix: Empty('.json'),
  folder: Any(),
  blob: Skip({}),
  map: Skip({}),
  shared: Skip({}),
  
  local: {
    active: false,
    folder: '',
    suffixMode: 'none',
  },
  
  // keys are canon strings
  ent: Default(
    {},
    Child({
      // Save a sub array as JSONL. NOTE: Other fields are LOST!
      jsonl: Skip(String),

      // Save a sub field as binary. NOTE: Other fields are LOST!
      bin: Skip(String),
    }),
  ),
  
}

async function blob_store(this: any, options: any) {
  const seneca = this
  const init = seneca.export('entity/init')

  let generate_id = options.generate_id || seneca.export('entity/generate_id')
  let blob_client: any = null
  let local_folder: string = ''
  let blob_shared_options = {
    // Bucket: '!not-a-bucket!',
    // ...options.shared,
  }
  
  function get_container(ent: any) {
    let container: any = {}
      
    let canon = ent.canon$({ object: true })
    container.name = (null != canon.base ? canon.base + '-' : '') + canon.name
      
    return container
  }
  
  async function load_container_client(name: string) {
    let container_client = blob_client.getContainerClient(name)
    let exists: boolean = await container_client.exists()
    if (!exists) {
      await container_client.create()
    }
    return container_client
  }

  let store = {
    name: 'blob-store',
    save: function (msg: any, reply: any) {
    
      let canon = msg.ent.entity$
      let id = '' + (msg.ent.id || msg.ent.id$ || generate_id(msg.ent))
      let d = msg.ent.data$()
      d.id = id

      let blob_id = make_blob_id(id, msg.ent, options)
      let co = get_container(msg.ent)
      
      let Body: Buffer | undefined = undefined
      let entSpec = options.ent[canon]
      
      // console.log('blob_id: ', blob_id)
      // console.log('co: ', co)
      
      if (entSpec || msg.jsonl$ || msg.bin$) {
        let jsonl = entSpec?.jsonl || msg.jsonl$
        let bin = entSpec?.bin || msg.bin$
	
	// JSONL files
        if ('string' === typeof jsonl && '' !== jsonl) {
          let arr = msg.ent[jsonl]
          if (!Array.isArray(arr)) {
            throw new Error(
              'blob-store: option ent.jsonl array field not found: ' + jsonl,
            )
          }

          let content = arr.map((n: any) => JSON.stringify(n)).join('\n') + '\n'
          Body = Buffer.from(content)          
        }
        // Binary Files
        else if ('string' === typeof bin && '' !== bin) {
          let data = msg.ent[bin]
          if (null == data) {
            throw new Error(
              'blob-store: option ent.bin data field not found: ' + bin,
            )
          }

          Body = Buffer.from(data)
        }
      }

      if (null == Body) {
        let dj = JSON.stringify(d)
        Body = Buffer.from(dj)
      }
      
      let ento = msg.ent.make$().data$(d)
      
      if(options.local.active) {
        
        let full: string = Path.join(local_folder, blob_id || id)
        let path: string = Path.dirname(full)
        
        // console.log('dirname: ', path )
        Fsp.mkdir(path, { recursive: true })
          .then((out: any) => {
            Body && Fsp.writeFile(full, Body as any)
              .then((_res: any) => {
                reply(null, ento)
              })
              .catch((err: any) => {
                 reply(err)
            })
        })
        .catch((err: any) => {
          reply(err)
        })
      }
      else {
        do_upload()
      }
      
      async function do_upload() {
        let container_client = await load_container_client(co.name)
        let block_blob = container_client.getBlockBlobClient(blob_id)
        try {
          Body && await block_blob.uploadData(Body, Body.length)
          reply(null, ento)
        } catch(err) {
          reply(err, null)
        }
        
      }
    },
    load: function (msg: any, reply: any) {
    
      let canon = msg.ent.entity$
      let qent = msg.qent
      let id = '' + msg.q.id

      const co = get_container(msg.ent)
      let blob_id = make_blob_id(id, msg.ent, options)
      
      let entSpec = options.ent[canon]
      let output: 'ent' | 'jsonl' | 'bin' = 'ent'

      let jsonl = entSpec?.jsonl || msg.jsonl$ || msg.q.jsonl$
      let bin = entSpec?.bin || msg.bin$ || msg.q.bin$

      output = jsonl && '' != jsonl ? 'jsonl' : bin && '' != bin ? 'bin' : 'ent'
      
      function replyEnt(body: any) {
        let entdata: any = {}

        // console.log('DES', output, body)
        if ('bin' !== output) {
          body = body.toString('utf-8')
        }
        
        if ('jsonl' === output) {
          entdata[jsonl] = body
            .split('\n')
            .filter((n: string) => '' !== n)
            .map((n: string) => JSON.parse(n))
        } else if ('bin' === output) {
          entdata[bin] = body
        } else {
          entdata = JSON.parse(body)
        }

        entdata.id = id

        let ento = qent.make$().data$(entdata)
        reply(null, ento)
      }
      
      
      if(options.local.active) {
        let full: string = Path.join(local_folder, blob_id || id)

        Fsp.readFile(full)
          .then((body: any) => {
            replyEnt(body)
          })
          .catch((err: any) => {
            if ('ENOENT' == err.code) {
              return reply()
            }
            reply(err)
          })
            
      }
      else {
        do_download()
      }
      
      async function do_download() {
        let container_client = await load_container_client(co.name)
        let block_blob = container_client.getBlockBlobClient(blob_id)
        try {
          // let body: any = await block_blob.downloadToBuffer()
          const downloadBlockBlobResponse = await block_blob.download(0);
          let body: any = await destream(output,
            downloadBlockBlobResponse.readableStreamBody)
          
          replyEnt(body)
                
        } catch(err: any) {
          if (err && 'BlobNotFound' == err.details.errorCode) {
            return reply()
          }
          reply(err, null)
        }
        
      }
    },
    list: function (msg: any, reply: any) {
      reply([])
    },
    remove: function (msg: any, reply: any) {
      let qent = msg.qent
      let qid = '' + msg.q.id
      
      const co = get_container(msg.ent)
      let blob_id = make_blob_id(qid, msg.ent, options)
      
      if (null == qid) {
        return reply()
      }
      
      // Local file
      if(options.local.active) {
        let full: string = Path.join(local_folder, blob_id || qid)
        
        Fsp.unlink(full)
          .then((_res: any) => {
            reply()
          })
          .catch((err: any) => {
            if ('ENOENT' == err.code) {
              return reply()
            }
            reply(err)
          })
      }
      else {
        do_delete()
      }
      
      async function do_delete() {
        let container_client = await load_container_client(co.name)
        let block_blob = container_client.getBlockBlobClient(blob_id)
        try {
          await block_blob.delete()
          reply()
        } catch(err: any) {
          if (err && 'BlobNotFound' == err.details.errorCode) {
            return reply()
          }
          reply(err, null)
        }
        
      }
    },
    close: function (msg: any, reply: () => void) {
      reply()
    },
    native: function (msg: any, reply: any) {
      reply({ client: blob_client, local: { ...options.local } } )
    },
  }

  let meta = init(seneca, options, store)
  
  seneca.add({ init: store.name, tag: meta.tag}, function (msg: any, reply: () => void) {
    // BLOB SDK setup

    const blob_opts = {
      ...options.blob,
    }
    
    if (options.local.active) {
      let folder: string = options.local.folder
      local_folder =
        'genid' == options.local.suffixMode
          ? folder + '-' + seneca.util.Nid()
          : folder
      return reply()
    }
    
    if('local' == blob_opts.mode) { 
      const connectionString = 
        `UseDevelopmentStorage=true; BlobEndpoint=${ blob_opts.endpoint || 'http://127.0.0.1:10000/devstoreaccount1'}`
      blob_client = BlobServiceClient.fromConnectionString(connectionString)
      
    } else {
      const account = blob_opts.account
      const accountKey = blob_opts.key
      const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey)
    
      blob_client = new BlobServiceClient(
        `https://${account}.blob.core.windows.net`,
        sharedKeyCredential
      )
      
    }
    
    reply()
    
  })

  return {
    name: store.name,
    tag: meta.tag,
    exportmap: {
      native: blob_client,
    },
  }
}

function make_blob_id(id: string, ent: any, options: any) {
  let blobid =
    null == id
      ? null
      : (null == options.folder
          ? options.prefix + ent.entity$
          : options.folder) +
        ('' == options.folder ? '' : '/') +
        id +
          options.suffix

  return blobid
}

async function destream(output: 'ent' | 'jsonl' | 'bin', readable: any) {
  return new Promise((resolve, reject) => {
    const chunks: any = []
    readable.on('data', (chunk: any) => chunks.push(chunk))
    readable.on('error', reject)
    readable.on('end', () => {
      let buffer = Buffer.concat(chunks)
      if ('bin' === output) {
        resolve(buffer)
      } else {
        resolve(buffer.toString('utf-8'))
      }
    })
  })
}

Object.defineProperty(blob_store, 'name', { value: 'blob-store' })
module.exports = blob_store
