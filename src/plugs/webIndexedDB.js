/**
 * [Indexeddb is used for web client storage]
 * Author: xiaolin.fang
 * Email: 893281878@qq.com
 * @type {[type]}
 */

// In the following line, you should include the prefixes of implementations you want to test.
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// DON'T use "var indexedDB = ..." if you're not in a function.
// Moreover, you may need references to some window.IDB* objects:
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)

let request = null
let dbClient = null
const dbName = 'catchMap'
// console.log(window.indexedDB, window.IDBTransaction, window.IDBKeyRange);
const IndexedDB = {
  createDB(){
    if (!window.indexedDB) {
      window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.")
      return
    }
    request = window.indexedDB.open("yitong");
    request.onerror = function(event) {
      alert("Database error: " + event.target.errorCode);
      // Do something with request.errorCode!
    };
    request.onsuccess = function(event) {
      dbClient = event.target.result
      // Do something with request.result!
    };
    // 该事件仅在较新的浏览器中实现了
    request.onupgradeneeded = function(event) {
      // 保存 IDBDataBase 接口
      var db = event.target.result;

      // 为该数据库创建一个对象仓库
      db.createObjectStore("catchMap", { keyPath: "key" });
      db.createObjectStore("mapData", { keyPath: "pIndex" })
    };

  },
  insertOne(data) {
    //通过事务控制对象获取数据表对象
    let objectStore = dbClient.transaction([dbName],"readwrite").objectStore(dbName);
    let allQuery = []
    let count = 0
    let maxCount = 49
    let self = this
    let countRequest = objectStore.count();
    return new Promise((resolve, reject)=>{
      countRequest.onsuccess = async (event) => {
        count = event.target.result
        let dataAll = await self.getAllFun()
        let versionData = dataAll.reverse()
        if(count >= maxCount){
          let lastVersionKey = versionData[versionData.length -1].key
          self.deleteDataByKey(lastVersionKey)
        }
        self.addData(data, dbName)
        resolve(event)
      }
      countRequest.onerror = (event) =>{
        console.error(event, '/count error');
        reject(event)
      }
    })

  },
  addData(data,db){
    // console.log(data, db);
    let objectStore = dbClient.transaction([db],"readwrite").objectStore(db);
    var addRequest = objectStore.add(data);
    addRequest.onsuccess = function(event){
      // console.log('缓存数据成功,数据版本 key：', event.target.result);
    }
    addRequest.onerror = function(event){
      // console.error('缓存数据失败,', event);
    }
  },
  deleteDataByKey(key){
    let objectStore = dbClient.transaction([dbName],"readwrite").objectStore(dbName);
    objectStore.delete(key)
  },
  getAllFun () {
    const arr = []
    const obj =  dbClient.transaction([dbName],"readwrite").objectStore(dbName);
    return new Promise(resolve => {
      obj.openCursor().onsuccess = e => {
        const cursor = e.target.result
        if (cursor) {
          arr.push(cursor.value)
          cursor.continue()
        } else {
          return resolve(arr)
        }
      }
    })
  },
  backUpMapData(sources){
    this.addData(sources, 'mapData')
  },
  clearAll(db){
    try{
      let  objectStore = dbClient.transaction([db],"readwrite").objectStore(db);
      objectStore.clear()
    }catch(e){
      window.location.reload()
    }
  },
  showCount(){
    let objectStore = dbClient.transaction([dbName],"readwrite").objectStore(dbName);
    var reque = objectStore.count();//数据库访问方法
    reque.onsuccess = function(){
      var count = event.target.result;
      return count
    }
  }
}
window.onload = IndexedDB.createDB()
module.exports = IndexedDB
