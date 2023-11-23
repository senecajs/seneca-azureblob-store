/* Copyright (c) 2023 Richard Rodger, MIT License */

import { Skip, Any } from 'gubu'

import {
  DefaultAzureCredential
} from "@azure/identity"

import {
  BlobServiceClient,
  StorageSharedKeyCredential
} from '@azure/storage-blob'

blob_store.defaults = {
  prefix: 'seneca/db01/',
  folder: Any(''),
  blob: Skip({}),
  map: Skip({}),
  shared: Skip({}),
}

async function blob_store(this: any, options: any) {
  const seneca = this
  const init = seneca.export('entity/init')

  let generate_id = options.generate_id || seneca.export('entity/generate_id')
  let blob_client: any = null
  let blob_shared_options = {
    // Bucket: '!not-a-bucket!',
    // ...options.shared,
  }
  
  function get_container(ent: any) {
    let container: any = {}
      
    let canon = ent.canon$({ object: true })
    container.name = (null != canon.base ? canon.base + '_' : '') + canon.name
      
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
      let id = '' + (msg.ent.id || msg.ent.id$ || generate_id(msg.ent))
      let d = msg.ent.data$()
      d.id = id
      let dj = JSON.stringify(d)

      let blob_id = make_blob_id(id, msg.ent, options)
      let co = get_container(msg.ent)
      
      // console.log('blob_id: ', blob_id)
      // console.log('co: ', co)
      
      do_upload()
      
      async function do_upload() {
        let container_client = await load_container_client(co.name)
        let block_blob_client = container_client.getBlockBlobClient(blob_id)
        let dataBuffer = Buffer.from(dj)
        try {
          await block_blob_client.uploadData(dataBuffer, dataBuffer.length)
          let ento = msg.ent.make$().data$(d)
          reply(null, ento)
        } catch(err) {
          reply(err, null)
        }
        
      }
    },
    load: function (msg: any, reply: any) {
      let qent = msg.qent
      let id = '' + msg.q.id

      const co = get_container(msg.ent)
      let blob_id = make_blob_id(id, msg.ent, options)
      
      do_download()
      
      async function do_download() {
        let container_client = await load_container_client(co.name)
        let block_blob_client = container_client.getBlockBlobClient(blob_id)
        try {
          let d = (await block_blob_client.downloadToBuffer()).toString()
          let ento = qent.make$().data$(JSON.parse(d))
          reply(null, ento)
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
      let id = '' + msg.q.id
      
      const co = get_container(msg.ent)
      let blob_id = make_blob_id(id, msg.ent, options)
      
      if (null == msg.q.id) {
        return reply()
      }
      
      do_delete()
      
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
    native: function (msg: any, reply: () => void) {
      reply()
    },
  }

  let meta = init(seneca, options, store)
  
  seneca.add({ init: store.name, tag: meta.tag}, function (msg: any, reply: () => void) {
    // BLOB SDK setup

    const blob_opts = {
      ...options.blob,
    }
    
    if('local' == blob_opts.mode) { 
      const connectionString = 
        `UseDevelopmentStorage=true; BlobEndpoint=${ blob_opts.endpoint || 'http://127.0.0.1:10000/devstoreaccount1'}`
      blob_client = BlobServiceClient.fromConnectionString(connectionString)
      
    } else {
      const account = blob_opts.account
      const defaultAzureCredential = new DefaultAzureCredential()
    
      blob_client = new BlobServiceClient(
        `https://${account}.blob.core.windows.net`,
        defaultAzureCredential
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
  return null == id
    ? null
    : (null == options.folder ? options.prefix + ent.entity$ : options.folder) +
        '/' +
        id +
        '.json'
}

Object.defineProperty(blob_store, 'name', { value: 'blob-store' })
module.exports = blob_store
