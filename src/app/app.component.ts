import { Component } from '@angular/core';

import 'ol/ol.css';
import Feature from 'ol/Feature.js';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Circle from 'ol/geom/Circle.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {OSM, Vector as VectorSource} from 'ol/source.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';
import BingMaps from 'ol/source/BingMaps.js';
import {getDistance} from 'ol/sphere.js';
import Select from 'ol/interaction/Select';
import {click, pointerMove, altKeyOnly} from 'ol/events/condition.js';

import LinearRing from 'ol/geom/LinearRing';
import {Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon} from 'ol/geom';


import $ from 'jquery';
import http  from '../http';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = 'bingMap';
  selectedPolygeon = []
  mapLayers = []
  map = null
  styles = {
    // 'Point': new Style({
    //   image: image
    // }),
    'LineString': new Style({
      stroke: new Stroke({
        color: 'green',
        width: 1
      })
    }),
    'MultiLineString': new Style({
      stroke: new Stroke({
        color: 'green',
        width: 1
      })
    }),
    // 'MultiPoint': new Style({
    //   image: image
    // }),
    'MultiPolygon': new Style({
      stroke: new Stroke({
        color: 'yellow',
        width: 1
      }),
      fill: new Fill({
        color: 'rgba(255, 255, 0, 0.1)'
      })
    }),
    'Polygon': new Style({
      stroke: new Stroke({
        color: 'blue',
        lineDash: [0],
        width: 1
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 30, 0.1)'
      })
    }),
    'GeometryCollection': new Style({
      stroke: new Stroke({
        color: 'magenta',
        width: 2
      }),
      fill: new Fill({
        color: 'magenta'
      }),
      image: new CircleStyle({
        radius: 10,
        fill: null,
        stroke: new Stroke({
          color: 'magenta'
        })
      })
    }),
    'Circle': new Style({
      stroke: new Stroke({
        color: 'red',
        width: 2
      }),
      fill: new Fill({
        color: 'rgba(255,0,0,0.2)'
      })
    })
  };
  constructor() {

    console.log('ChildComponent constructor', http);
    // Output：undefined
  }

  ngOnInit() {
    this.initMap()
  }

  ngOnChanges(changes){

  }
  async initMap(){
    let self = this
    var image = new CircleStyle({
      radius: 5,
      fill: null,
      stroke: new Stroke({color: 'red', width: 1})
    });

    var styleFunction = function(feature) {
      let style = self.styles[feature.getGeometry().getType()];
      return style
    };

// https://skypulischinanorth.blob.core.chinacloudapi.cn/public/demo/bingmap/Fargo_L13_s3_edit/metadata.json
    let metaDataUrl = 'https://skypulis1chinanorth2.blob.core.chinacloudapi.cn/public/demo/bingmap/Pinggu_L15_s3_edit/metadata.json'
    let metaData = await this.getMetaData(metaDataUrl)
    let imagesUrl = await this.getImagesUrls(metaData.images)

    self.mapLayers = [
      new TileLayer({
        // source: new OSM(),
        // bing map
        source: new BingMaps({
          key: 'AopmtyApcdbefoeVW-LwENG5VhXWvi7_qJ4-C2AYwMR_GVmxCy2A4lCBOKhna761',
          imagerySet: 'Aerial'
        }),
        preload: Infinity
      })
    ]
    imagesUrl.forEach(async (url,index) =>{
      let layer = new VectorLayer({
        source: new VectorSource({
          url: url,
          format: new GeoJSON()
        }),
        style: styleFunction
      });
      this.mapLayers.push(layer)
    })

    let lat = (metaData.minlat + metaData.maxlat) /2.0
    let lon = (metaData.minlon + metaData.maxlon)/ 2.0
    let scale = metaData.scale || 1
    let level = metaData.level
    this.lanchMap(lat, lon, scale, level)
}
  lanchMap(lat, lon, scale, level){
    let self = this
    if(self.mapLayers.length){
      let view = new View({
        // projection：坐标系 ，必须设置
        projection : 'EPSG:4326',
        center: [lon, lat],
        zoom: level,
        minZoom: level - 3,
        maxZoom: level + scale - 1
      })

      var map = new Map({
        layers: self.mapLayers,
        target: 'map',
        view: view
      });
      if(self.map === null){
        self.map = map
      }
      this.selectPolygon(map)
    }

  }
  // bind events
  selectPolygon(map){
    let self = this
   var select = null
   // var selectSingleClick = new Select()
   // click
   var selectClick = new Select({
      condition: click,
      multi: true,
      style: new Style({
        stroke: new Stroke({
          color: 'red',
          lineDash: [0],
          width: 1
        }),
        fill: new Fill({
          color: 'rgba(255, 0, 0, 0.3)'
        })
      }),
      // filter: function (feature, layer) {
      //   console.log(feature, layer);
      //     // throw new Error("Not implemented yet");
      // }
    })
    // hover
    // var selectPointerMove = new Select({
    //   condition: pointerMove
    // });
    //
    // //  alt + click
    // var selectAltClick = new Select({
    //   condition: function(mapBrowserEvent) {
    //     return click(mapBrowserEvent) && altKeyOnly(mapBrowserEvent);
    //   }
    // })

    select = selectClick
    if (select !== null) {
      map.addInteraction(select);
      select.on('select', function(e) {
        // 选择区域
        let deselectNum = e.deselected.length
        let selectedItem = e.selected
        // let layers = []
        // self.test()

        if(!deselectNum){
          self.selectedPolygeon.push(selectedItem)
        }else{
          self.selectedPolygeon = []
          self.selectedPolygeon.push(selectedItem)
          // layers.push(e.target.getOverlay())
        }
        let currLayer  = e.target.getOverlay()
        if(self.selectedPolygeon.length > 1){
          self.mergePolygons(self.selectedPolygeon, currLayer)
        }

      });
    }
  }
  test(){
    let arr1= [[1,3],[5,7],[6,9],[10,15]]
    let arr2 = [[1.5,2.2],[8,10],[6.2,8.5],[12,16],[50,12]]
    let tempArr = []
    let tempArr2 = []
    let newArr = []
    for(let i = 0; i<arr1.length; i++){
      for(let j = 0; j< arr2.length; j++){
        let num1 = Math.abs(arr1[i][0] - arr2[j][0])
        let num2 = Math.abs(arr1[i][1] - arr2[j][1])
        if(num1 < 1 && num2 <1){
          tempArr.push(arr1[i])
          tempArr2.push(arr2[j])
        }
      }
    }
    console.log('相邻1:', tempArr);
    console.log('相邻2',tempArr2);
    if(tempArr.length){
      for(let k = 0; k< arr1.length; k++){
        for(let l = 0; l<tempArr.length; l++){
          // console.log(arr1[k][0], tempArr[l]);
          if(arr1[k] === tempArr[l]){
            // console.log(arr1[k].index());
            arr1.splice(k, 1)
          }
        }
      }
       console.log('newArr1:',arr1);
    }

    if(tempArr2.length){
      for(let k = 0; k< arr2.length; k++){
        for(let l = 0; l<tempArr2.length; l++){
          if(arr1[k] === tempArr2[l]){
            arr1.splice(k, 1)
          }
        }
      }
    }
    console.log('newArr2:',arr2);

    console.log('合并Arr', arr1.concat(arr2));
  }
  // 合并
  mergePolygons(features, currLayer){

     // var parser = new jsts.io.OL3Parser();
     // parser.inject(Point, LineString, LinearRing, Polygon, MultiPoint, MultiLineString, MultiPolygon);

     let pointers = []
     for (var i = 0; i < features.length; i++) {
       var feature = features[i][0];
       let points = feature.getGeometry().getCoordinates()
       pointers.push(points)
     }
     this.contrast(pointers, features, currLayer)
  }
  contrast(arr, features, currLayer){
    let self = this
    let tempArr = []
    let nearByArr1Point = []
    let nearByArr2Point = []
    let newPolygon = []
    // for(let i = 0; i < arr.length; i++){
      let arr1 = arr[0][0]
      let arr2 = arr[1][0]
      let descs = []
      for(let i = 0; i < arr1.length; i++){
        for(let j = 0; j< arr2.length; j++){
          // ol shpere 获取坐标之间距离
          // let juli = getDistance(arr1[i], arr2[j], 4326)
          // descs.push(juli)

           let latPoor = Math.pow(parseFloat(arr1[i][0]) - parseFloat(arr2[j][0]),2)
           let lonPoor = Math.pow(parseFloat(arr1[i][1]) - parseFloat(arr2[j][1]),2)
           let des = Math.sqrt(latPoor + lonPoor)

           // let latPoor = Math.abs(parseFloat(arr1[i][0] - parseFloat(arr2[j][0]))
           // let lonPoor = Math.abs(parseFloat(arr1[i][1]) - parseFloat(arr2[j][1]))

           if(des < Math.pow(10,-5)){
             nearByArr1Point.push(arr1[i])
             nearByArr2Point.push(arr2[j])
           }
        }
      }
      // console.log(descs.sort());
    // }
    if(nearByArr1Point.length && nearByArr2Point.length){
      nearByArr1Point = self.arrayUniQue(nearByArr1Point)
      nearByArr2Point = self.arrayUniQue(nearByArr2Point)

      let newArr1 = self.refetchArray(self.getNearByIndex(arr1, nearByArr1Point), self.getNearByIndex(arr2, nearByArr2Point))
      // let newArr2 = self.unionArrItem(self.getNearByIndex(arr2, nearByArr2Point))

      let allPoints = newArr1
      let newPolygon = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [allPoints]
        }
      }
      var source = new VectorSource({
        features: (new GeoJSON()).readFeatures(newPolygon)
      });
      var layer = new VectorLayer({
        source: source,
        style: new Style({
          stroke: new Stroke({
            color: 'green',
            lineDash: [0],
            width: 1
          }),
          fill: new Fill({
            color: 'rgba(0, 255, 255, 0.8)'
          })
        })
        // style: self.styles['Polygon']
      });
      self.confirmAlert('确定要合并吗？', layer, features, currLayer)
    }else{
      alert('请选择相邻区域进行合并')
      return
    }
  }
  arrayUniQue(arr){
    var result=[], hash={};
    for(var i=0;i<arr.length;i++){
        if(!hash[arr[i]]){
            result.push(arr[i]);
            hash[arr[i]]=true;
        }
    }
    return result;
  }
  confirmAlert(msg, layer, features, currLayer){
    let self = this
    if(confirm(msg)){
      self.map.addLayer(layer)
      // console.log(currLayer.getSource() ,'/get layer');
      // currLayer.getSource().clear(true)
       console.log(currLayer.getSource());

      // for(let i = 0; i<features.length; i++){
      //   console.log(features[i]);
      // }

    }else{
      console.log('cancle');
    }
  }
  getNearByIndex (arr, nearArr){
    let start = null
    let end = null
    let obj = {}
    // 移除相邻距离 坐标
    for(let i = 0; i< arr.length; i++){

      if(arr[i] === nearArr[0]){
        start = i
      }
      if(arr[i] === nearArr[nearArr.length-1]){
        end = i
      }
    }
    if(start !== null && end !== null){
      obj = {
        start,
        end,
        arr,
        length: nearArr.length
      }
    }
    return obj
  }
  // 合并两个图形坐标，得到新图形坐标
  refetchArray(obj, obj2){
    // console.log(obj.start, obj.end, obj.length);
    let arr = obj.arr
    let arrFront = null
    let arrEnd = null
    let newArr = []
    if(obj.start < obj.end){
      arrFront = arr.slice(0, obj.start)
      arrEnd = arr.slice(obj.end , arr.length)
    }else{
      arrFront = arr.slice(obj.start, arr.length)
      arrEnd = arr.slice(0, obj.end)
    }
    // TODO: 处理合并块数据截取、重组
    let arr2 = obj2.arr
    let arrFront2 = null
    let arrEnd2 = null
    if(obj2.start < obj2.end){
      arrFront2 = arr2.slice(0, obj2.start)
      arrEnd2 = arr2.slice(obj2.end , arr2.length)
    }else{
      arrFront2 = arr2.slice(obj2.start, arr2.length)
      arrEnd2 = arr2.slice(0, obj2.end)
    }
    newArr = arrFront.concat(arrFront2).concat(arrEnd2).concat(arrEnd)
    return newArr
  }
  async getfeatures(geoJson){
    return (new GeoJSON()).readFeatures(geoJson)
  }
  async getMetaData(url){
    let self = this
    let metaData = await http.get(url)
    return metaData
  }
  getImagesUrls (images){
    let genJsonUrl = 'https://skypulis1chinanorth2.blob.core.chinacloudapi.cn/public/demo/bingmap/Pinggu_L15_s3_edit/contour_'
    // let geoJsonData = []
    let imagesUrl = []
    images.forEach((image)=>{
      image.forEach(async (item) =>{
        let url = genJsonUrl + item.image.slice(0,item.image.indexOf('.')) + '.json'
        imagesUrl.push(url)
        // let geoJson = await this.getGeoJsonData(url)
        // geoJsonData.push(geoJson.data)
      })
    })
    // console.log(geoJsonData, '///');

    return imagesUrl
  }
  async getGeoJsonData(url){
    let geoJson = await http.get(url)
    return geoJson
  }


}
