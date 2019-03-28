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
  }
}
export{
  http as default
}
