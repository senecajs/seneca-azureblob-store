const Seneca = require('seneca')

const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} = require("@azure/storage-blob")


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
    })
  await seneca.ready()
  
  const expiryTime = new Date()
  expiryTime.setMinutes(expiryTime.getMinutes() + 1)

  let dwn_url = await seneca.post('cloud:azure,service:store,get:url,kind:download', {
    container: containerName,
    filepath: blobName,
    expire: expiryTime.getTime()
  })
  
  
  let upl_url = await seneca.post('cloud:azure,service:store,get:url,kind:upload', {
    container: containerName,
    filepath: blobName,
    expire: expiryTime.getTime()
  })
  
  console.log('download: ', dwn_url)
  console.log('upload: ', upl_url)
  
  // let url = generateDownloadUri(connectionString, containerName, blobName)
  

  // console.log(url)


}

main()



