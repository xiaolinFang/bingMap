import axios from 'axios';
const http = {
  async get(url, data){
    let params = data || ''
    let result = await axios.get(url,{params})
    return new Promise((resolve, reject)=>{
      if(result.status === 200){
        resolve(result.data)
      }else {
        reject(result)
      }
    })
  },
  post(url, data){
    return new Promise((resolve, reject)=>{
      let result = axios.post(url, data).then((res)=>{
        console.log(res, 'res');
        resolve(result.data)
      }).catch((error) => {
      console.log(error, 'error');
      reject(result)
    });
    })
  }
}
const urlConfig = {
  production:false,
  saveJsonUrl: '/proxy/api/image/UploadJson'
}
const urlConfig = {
  production: true,
  saveJsonUrl: 'https://apulis-china-infra01.apulis.com/api/image/UploadJson'
}
export{
  http as default, urlConfig
}
