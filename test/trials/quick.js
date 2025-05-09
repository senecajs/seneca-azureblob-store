const Seneca = require('seneca')

const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require("@azure/storage-blob")

const {
  DefaultAzureCredential,
  AzureCliCredential,
} = require("@azure/identity")


// Test using curl:
// curl "http://127.0.0.1:10000/devstoreaccount1/optent-color/seneca/db01/-/optent/color/dg7ld4.json?sv=2023-11-03&st=2023-12-08T16%3A35%3A29Z&se=2023-12-08T16%3A36%3A29Z&sr=b&sp=w&sig=OWFdklc37JmGyYWpiAHju8ff%2BNufxKxxGekBxZa%2BT2Q%3D" -T file.json -H "x-ms-blob-type: BlockBlob"

function generateDownloadUri(connectionString, containerName, blobName) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)

    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blobClient = containerClient.getBlobClient(blobName)

    const expiryTime = new Date()
    expiryTime.setMinutes(expiryTime.getMinutes() + 1)

    const sasToken = generateBlobSASQueryParameters({
        containerName: containerName,
        blobName: blobName,
        permissions: BlobSASPermissions.parse("r"), // r | w
        startsOn: new Date(),
        expiresOn: expiryTime
    }, blobServiceClient.credential).toString()

    const downloadUrl = blobClient.url + "?" + sasToken

    return downloadUrl
}

async function main_delegationKey() {
  let connectionString = `UseDevelopmentStorage=true; BlobEndpoint=${'http://127.0.0.1:10000/devstoreaccount1'}`
    
  const containerName = 'test-container01'
  const blobName = 'folder01/text.log'
  
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use('./../../..', {
      blob: {
        mode: 'auth_credential',
        account: 'alextest02',
        auth: new DefaultAzureCredential(),
      },
      shared: {
        Container: containerName
      }
    })
  await seneca.ready()
  

  let dwn_url = await seneca.post('cloud:azure,service:store,get:url,kind:download', {
    container: containerName,
    filepath: blobName,
    expire: 600 // seconds
  })

  console.log('delegation dwn_url: ', dwn_url)

  // NOTE: REQUIRES the role assignment of 'Storage Blob Data Contributor'
  let file_response = await fetch(dwn_url.url, {
    method: 'GET'
  })

  console.log(file_response)


}

async function main() {
  let connectionString = `UseDevelopmentStorage=true; BlobEndpoint=${'http://127.0.0.1:10000/devstoreaccount1'}`

  const containerName = 'optent-color'
  const blobName = 'seneca/db01/-/optent/color/dg7ld44.json'
  
  const seneca = Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity', { mem_store: false })
    .use('./../../..', {
      blob: {
        mode: 'local',
        endpoint: 'http://127.0.0.1:10000/devstoreaccount1',
      },
      shared: {
        Container: containerName
      }
    })
  await seneca.ready()
  

  let dwn_url = await seneca.post('cloud:azure,service:store,get:url,kind:download', {
    container: containerName,
    filepath: blobName,
    expire: 600 // seconds
  })
  
  
  let upl_url = await seneca.post('cloud:azure,service:store,get:url,kind:upload', {
    container: containerName,
    filepath: blobName,
    expire: 600
  })
  
  console.log('download: ', dwn_url)
  console.log('upload: ', upl_url)
  
  let url = generateDownloadUri(connectionString, containerName, blobName)
  

  console.log(url)


}

