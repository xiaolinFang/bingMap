import { Component } from "@angular/core";

import "ol/ol.css";
import Feature from "ol/Feature.js";
import Map from "ol/Map.js";
import View from "ol/View.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Circle from "ol/geom/Circle.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { OSM, Vector as VectorSource } from "ol/source.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
import BingMaps from "ol/source/BingMaps.js";
import { getDistance } from "ol/sphere.js";
import Select from "ol/interaction/Select";
import { click, pointerMove, altKeyOnly } from "ol/events/condition.js";
import LayerGroup from "ol/layer/Group";
import { Draw, Modify, Snap } from "ol/interaction.js";
import LinearRing from "ol/geom/LinearRing";
import {
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon
} from "ol/geom";
import Observable from "ol/Observable";
import IndexedDB from "../plugs/webIndexedDB.js";

import $ from "jquery";
// import http  from '../http';
import { Base64 } from "js-base64";
import http from "../assets/js/http";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.less"]
})
// iframe url
// https://apulis-china-infra01.apulis.com/yitong/index.html?siteUrl=https://skypulis1chinanorth2.blob.core.chinacloudapi.cn/public&service=demo/bingmap/Pinggu_L15_s3_edit
export class AppComponent {
  title = "bingMap";
  showBtns = false;
  btnStyle = {};
  selectedPolygeon = [];
  mergepolygonNewFeature = null;
  selectPointerMove = null;
  showSure = true;
  mapLayers = [];
  map = null;
  draw = null;
  select = null;
  snap = null;
  modify = null;
  breakupLine = [];
  options = [-5, -6, -7, -8];
  breakPolygeon1 = [];
  breakPolygeon2 = [];
  feature = null;
  imagesData = [];
  showBreakActive = false;
  showFusionActive = false;
  showRestoreActive = false;
  currentPrefix = "demo/bingmap/Pinggu_L15_s3_edit";
  siteUrl = "";
  service = "";
  latestVersionCatchData = [];
  showHistoryVersions = false;
  historyVersion = [];
  restoreConfirm = false;
  restoreVersion = null;
  currVersionLi = null;
  nowVersion = 0;
  rowLength = 0;
  colLength = 0;
  undoEnd = false;
  redoEnd = false;
  tipMsg = "";
  num = 0;
  timeSet = null;
  mouseClickEvt = null;
  selectedStyle = new Style({
    stroke: new Stroke({
      color: "green",
      lineDash: [0],
      width: 1
    }),
    fill: new Fill({
      color: "rgba(0, 255, 255, 0.8)"
    })
  });
  styles = {
    // 'Point': new Style({
    //   image: image
    // }),
    LineString: new Style({
      stroke: new Stroke({
        color: "green",
        width: 1
      })
    }),
    MultiLineString: new Style({
      stroke: new Stroke({
        color: "green",
        width: 1
      })
    }),
    // 'MultiPoint': new Style({
    //   image: image
    // }),
    MultiPolygon: new Style({
      stroke: new Stroke({
        color: "yellow",
        width: 1
      }),
      fill: new Fill({
        color: "rgba(255, 255, 0, 0.1)"
      })
    }),
    Polygon: new Style({
      stroke: new Stroke({
        color: "blue",
        lineDash: [0],
        width: 1
      }),
      fill: new Fill({
        color: "rgba(0, 0, 30, 0.1)"
      })
    }),
    GeometryCollection: new Style({
      stroke: new Stroke({
        color: "magenta",
        width: 2
      }),
      fill: new Fill({
        color: "magenta"
      }),
      image: new CircleStyle({
        radius: 10,
        fill: null,
        stroke: new Stroke({
          color: "magenta"
        })
      })
    }),
    Circle: new Style({
      stroke: new Stroke({
        color: "red",
        width: 2
      }),
      fill: new Fill({
        color: "rgba(255,0,0,0.2)"
      })
    })
  };
  constructor() {
    let url = window.location.href;
    this.siteUrl = this.getQueryString("siteUrl");
    this.currentPrefix = this.service =
      this.getQueryString("service") || this.currentPrefix;
    // console.log(this.siteUrl,this.service, 'cli init');
  }

  ngOnInit() {
    this.initMap();
  }

  ngOnChanges(changes) {
    // console.log(changes, '///changes');
  }

  cancle() {
    let self = this;
    self.showBtns = false;
    // console.log(self.selectPointerMove.getFeatures().clear());
    // self.selectPointerMove.getFeatures().clear()
    self.removeIniterActions();
  }
  getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
      return unescape(r[2]);
    }
    return null;
  }
  sureDone() {
    let self = this;
    let style = new Style({
      stroke: new Stroke({
        color: "white",
        lineDash: [2],
        width: 1
      }),
      fill: new Fill({
        color: "rgba(255, 25, 184, 0.8)"
      })
    });
    let currentObj = self.getCurrentJson(self.feature);
    // console.log(currentObj, '/////get currentObj');
    // console.log(self.map.getLayers());
    let name = currentObj.name;
    let pIndex = currentObj.pIndex;
    let index = currentObj.index;
    let currentJson = currentObj.currentJson;
    let oldData = {
      pIndex,
      geoJsonFile: {
        type: "FeatureCollection",
        features: self.getGeometryData(currentJson)
      }
    };
    let newFeatures = [];
    if (currentJson) {
      let currentFeatrue = currentObj.currentFeatrue;
      currentJson.splice(index, 1);

      // let layer1 = self.addLayerFun(self.breakPolygeon1, style)
      // let layer2 = self.addLayerFun(self.breakPolygeon2, style)
      // newLayers.push(layer1, layer2)
      let newFeature1 = self.getFeatureByCoordinats(
        self.breakPolygeon1,
        name,
        pIndex,
        index
      );
      let newFeature2 = self.getFeatureByCoordinats(
        self.breakPolygeon2,
        name,
        pIndex,
        index + 1
      );
      newFeatures.push(newFeature1);
      newFeatures.push(newFeature2);
      currentJson.splice(index, 0, newFeature1[0], newFeature2[0]);
      let featuresCollections = self.getGeometryData(currentJson);
      let geoJson = {
        type: "FeatureCollection",
        features: featuresCollections
      };
      // console.log(geoJson, '/geojson');
      self.saveJsonFile(name, geoJson, pIndex, index, oldData, newFeatures, [
        self.feature
      ]);
    }
    // console.log(currentJson, 'new json', index);
    // console.log(newFeature1, newFeature2);

    self.showBtns = false;
    self.removeIniterActions();
  }
  getCurrentJson(features) {
    let self = this;
    let feature = features[0];
    let name = feature.get("pName");
    let pIndex = feature.get("pIndex");
    let index = feature.get("index");
    let currentJson = self.findFeatureInJson(pIndex);
    let currentObj = {
      currentJson,
      name,
      pIndex,
      index,
      currentFeatrue: currentJson[index]
    };
    return currentObj;
  }
  // 更新数据保存
  async saveJsonFile(
    name,
    geojson,
    pIndex,
    index,
    oldData,
    newFeatures,
    oldFeatures
  ) {
    let self = this;
    // setInterval(self.timeSet)
    let getPoint = self.getRowAndColByIndex(pIndex);
    // debugger
    let jsonStr = JSON.stringify(geojson);
    let data = Base64.encode(jsonStr);

    let params = {
      prefix: self.currentPrefix,
      row: getPoint.row || 0,
      col: getPoint.col || 0,
      name: "contour_" + name + ".json",
      data: data
    };

    self.catchMapVersion(oldData, pIndex, params, index);
    self.updateMapView(newFeatures, oldFeatures, pIndex, name, index);
  }
  updateMapView(newFeatures, oldFeatures, pIndex, name, index) {
    let self = this;
    let currentLayer = self.map.getLayers().array_[pIndex + 1];
    let currentSoruce = currentLayer.getSource();
    // currentLayer.setSource(getSources)

    for (let i = 0; i < oldFeatures.length; i++) {
      try {
        currentSoruce.removeFeature(oldFeatures[i][0]);
      } catch (e) {}
    }
    for (let i = 0; i < newFeatures.length; i++) {
      let item = newFeatures[i];
      item[0].values_.pName = name;
      item[0].values_.pIndex = pIndex;
      item[0].values_.index = index;

      currentSoruce.addFeatures(item);
      let currentFeatures = currentSoruce.getFeatures();
      let newFeatureIndex = currentFeatures.indexOf(item[0]);

      let style = new Style({
        stroke: new Stroke({
          color: "white",
          lineDash: [2],
          width: 1
        }),
        fill: new Fill({
          color: "rgba(255, 25, 184, 0.7)"
        })
      });
      if (self.select) {
        self.select.getFeatures().clear();
        self.mergepolygonNewFeature = newFeatures[0];
        // currentFeatures[newFeatureIndex].setStyle(self.selectedStyle)
      } else {
        // self.selectPointerMove.getFeatures().clear()
        // currentFeatures[newFeatureIndex].setStyle(style)
        self.clearBreakupmodel();
        // self.unModify()
        // self.breakUpModel()
      }
    }

    currentSoruce.refresh();
    // 缓存最后一步编辑操作
    let newData = {
      pIndex,
      geoJsonFile: {
        type: "FeatureCollection",
        features: self.getGeometryData(currentSoruce.getFeatures())
      }
    };
    let getPoint = self.getRowAndColByIndex(pIndex);

    let params = {
      row: getPoint.row,
      col: getPoint.col,
      name: "contour_" + name + ".json"
    };
    self.catchMapVersion(newData, pIndex, params, null);
  }
  async updateImage(tip) {
    // params, oldLayers, name, pIndex, index, oldData
    let self = this;
    // params format
    let params = {
      prefix: self.currentPrefix,
      content: []
    };

    for (let i = 0; i < self.latestVersionCatchData.length; i++) {
      let image = self.latestVersionCatchData[i];
      let catchImage = image.catchImage;
      let dataJsonStr = JSON.stringify(catchImage.data);
      catchImage.data = Base64.encode(dataJsonStr);
      // catchImage.prefix = self.currentPrefix
      params.content.push(catchImage);
    }
    if (!params.content.length) {
      console.log("No changes need to be updated");
      return;
    }
    if (self.select) {
      self.select.getFeatures().clear();
    }
    if (self.selectPointerMove) {
      // self.selectPointerMove.getFeatures().clear()
      self.clearBreakupmodel();
    }
    let url = "/proxy/api/Image/Uploadjsons";
    let result = await http.post(url, params);
    // 更新数据成功
    if (result.status === 200 && result.data === "") {
      self.updateLayer();
    } else {
      if (tip) {
        alert("保存数据失败！");
      }
    }
  }
  // 保存后更新layer
  updateLayer() {
    let self = this;
    let data = self.latestVersionCatchData;
    for (let i = 0; i < data.length; i++) {
      let image = data[i];
      let pIndex = image.pIndex;
      // 更新视图
      self.updateLayersView(image.catchImage.name, pIndex);
    }
    console.log("数据更新成功");
    self.latestVersionCatchData = [];
    self.num = 0;
    // 保存成功后 清除缓存数据
    // IndexedDB.clearAll('catchMap')
  }
  updateLayersView(name, pIndex) {
    let self = this;
    let nowtime = new Date().getTime();
    // console.log(nowtime, '///get time');
    let apiUrl =
      "https://skypulis1chinanorth2.blob.core.chinacloudapi.cn/public/demo/bingmap/Pinggu_L15_s3_edit/";
    if (self.siteUrl && self.service) {
      apiUrl = self.siteUrl + "/" + self.service + "/";
    }

    let getSources = new VectorSource({
      url: apiUrl + name + "?_=" + nowtime,
      format: new GeoJSON()
    });

    var styleFunction = function(feature) {
      let style = self.styles[feature.getGeometry().getType()];
      return style;
    };
    // reset data structuresave
    var listenerKey = getSources.on("change", function(e) {
      if (getSources.getState() == "ready") {
        let itemName = name.slice(name.indexOf("_") + 1, name.lastIndexOf("."));
        self.resetDataStructure(getSources.getFeatures(), itemName, pIndex);
        let FeaturesLength = getSources.getFeatures().length - 1;
        let coors = getSources
          .getFeatures()
          [FeaturesLength].getGeometry()
          .getCoordinates();
        if (self.select) {
          self.select.getFeatures().clear();
          self.mergepolygonNewFeature = null;
        }

        // 拆分操作
      }
    });

    // 更新视图
    let currentLayer = self.map.getLayers().array_[pIndex + 1];
    currentLayer.setSource(getSources);
  }
  clearBreakupmodel() {
    let self = this;
    // self.selectPointerMove.getFeatures().clear()
    self.map.removeInteraction(self.selectPointerMove);
    self.map.removeInteraction(self.draw);
    self.map.removeInteraction(self.snap);
    self.map.removeInteraction(self.modify);
    self.selectPointerMove = null;
    self.breakUpModel();
  }
  backUpMapData() {
    let self = this;
    let imageData = self.map.getLayers().array_;
    let catchLayersData = [];
    for (let i = 1; i < imageData.length; i++) {
      let image = imageData[i];
      let imageFeatures = image.getSource().getFeatures();
      // console.log(imageFeatures, '///');
      let geoData = self.getGeometryData(imageFeatures);
      catchLayersData.push(geoData);
    }
    // IndexedDB.backUpMapData(catchLayersSource)
    // console.log(catchLayersData);
  }
  async catchMapVersion(oldData, pIndex, params, index) {
    let self = this;
    let dateNow = new Date();
    let tm = dateNow.getTime();
    let year = dateNow.getFullYear();
    let month = dateNow.getMonth() + 1;
    let day = dateNow.getDate();
    let hours =
      dateNow.getHours() < 10 ? "0" + dateNow.getHours() : dateNow.getHours();
    let min =
      dateNow.getMinutes() < 10
        ? "0" + dateNow.getMinutes()
        : dateNow.getMinutes();
    let sec =
      dateNow.getSeconds() < 10
        ? "0" + dateNow.getSeconds()
        : dateNow.getSeconds();
    let date =
      year +
      "/" +
      (month < 10 ? "0" + month : month) +
      "/" +
      day +
      " " +
      hours +
      ":" +
      min +
      ":" +
      sec;
    let newVersion = [];
    let oneCatch = {};
    // let dataJsonStr = JSON.stringify(oldData.geoJsonFile)
    // let base64 = Base64.encode(dataJsonStr)
    if (oldData && params) {
      oneCatch = {
        pIndex: oldData.pIndex,
        catchImage: {
          row: params.row,
          col: params.col,
          name: params.name,
          data: oldData.geoJsonFile
        }
      };
      newVersion.push(oneCatch);
    }
    // 将之前缓存image本更新到最新状态
    self.latestVersionCatchData.forEach((version, key) => {
      // console.log(version ,'///version');
      let itemIndex = version.pIndex;
      if (pIndex !== itemIndex) {
        let mapLayers = self.map.getLayers().array_[itemIndex + 1];
        let oldImageCurrentGeoJson = self.getGeometryData(
          mapLayers.getSource().getFeatures()
        );

        if (typeof version.catchImage.data === "string") {
          // 更新历史改动image 解码 - 编码
          let unencodeBs64 = Base64.decode(version.catchImage.data);
          let data = JSON.parse(unencodeBs64);
          data.features = oldImageCurrentGeoJson;
          version.catchImage.data = data;
          // let encode64 = Base64.encode(JSON.stringify(data))
          // version.catchImage.data = encode64
        } else {
          version.catchImage.data.features = oldImageCurrentGeoJson;
        }
        newVersion.push(version);
      }
    });

    if (newVersion.length) {
      self.latestVersionCatchData = newVersion;
    }

    let pointer = self.getRowAndColByIndex(pIndex);
    let module = self.showFusionActive ? " Fusion " : " Break up ";
    let indexString = index ? index.toString() : " ";
    let data = {
      module,
      currentPrefix: self.currentPrefix,
      editTime: date,
      row: pointer.row,
      col: pointer.col,
      featureIndex: indexString.indexOf(",")
        ? indexString.slice(0, indexString.lastIndexOf(","))
        : indexString,
      key: tm,
      versionData: newVersion.length ? newVersion : self.latestVersionCatchData
    };
    await IndexedDB.insertOne(data);
    let getAllcatchData = await IndexedDB.getAllFun();
    self.historyVersion = getAllcatchData.reverse();
    // console.log(self.historyVersion.length, self.historyVersion);
  }
  updateLastEdit() {
    let self = this;
    let newVersion = [];
    console.log("it is working");
    self.latestVersionCatchData.forEach((version, key) => {
      // console.log(version ,'///version');
      let itemIndex = version.pIndex;
      // if(pIndex !== itemIndex){

      let mapLayers = self.map.getLayers().array_[itemIndex + 1];
      let oldImageCurrentGeoJson = self.getGeometryData(
        mapLayers.getSource().getFeatures()
      );

      if (typeof version.catchImage.data === "string") {
        // 更新历史改动image 解码 - 编码
        let unencodeBs64 = Base64.decode(version.catchImage.data);
        let data = JSON.parse(unencodeBs64);
        data.features = oldImageCurrentGeoJson;
        version.catchImage.data = data;
        // let encode64 = Base64.encode(JSON.stringify(data))
        // version.catchImage.data = encode64
      } else {
        version.catchImage.data.features = oldImageCurrentGeoJson;
      }
      newVersion.push(version);
      // }
    });
    console.log(newVersion, "/newVersion");
    return newVersion;
  }
  showRestoreComfrim(version, event) {
    let self = this;
    self.restoreConfirm = true;
    self.tipMsg = `Are you sure you want to revert to version: ${version.key}`;
    let parentLi = event.srcElement.parentElement;
    $(parentLi)
      .addClass("selected")
      .siblings()
      .removeClass("selected");
    self.restoreVersion = version;
    self.currVersionLi = parentLi;
  }
  // 废弃
  restoreData() {
    let self = this;
    let versionData = self.restoreVersion.versionData;
    for (let i = 0; i < versionData.length; i++) {
      let imgData = versionData[i];

      let name = imgData.catchImage.name.slice(
        imgData.catchImage.name.indexOf("_"),
        imgData.catchImage.name.lastIndexOf(".")
      );
    }

    // console.log(self.restoreVersion);
  }
  restoreCancle() {
    this.restoreConfirm = false;
    $(this.currVersionLi).removeClass("selected");
  }
  // undo redo
  unDo() {
    let self = this;
    let versionData = self.historyVersion;
    self.nowVersion++;
    if (self.nowVersion < versionData.length) {
      let rebackVersion = versionData[self.nowVersion];
      self.doneSetVersion(rebackVersion, "undo");
      self.redoEnd = false;
    } else {
      self.nowVersion = versionData.length;
      self.undoEnd = true;
    }
  }
  reDo() {
    let self = this;
    self.nowVersion--;
    if (self.nowVersion >= 0) {
      let rebackVersion = self.historyVersion[self.nowVersion];
      self.doneSetVersion(rebackVersion, "redo");
      self.undoEnd = false;
    } else {
      self.nowVersion = 0;
      self.redoEnd = true;
    }
  }
  /**
   * 撤销、重做 步骤，执行版本数据还原方法：
   * 1、检查目标版本是否需要还原目标版本不存在的image 但上个版本有修改的image数据
   * 2、重做同理
   * @param  version [设置地图的缓存版本数据]
   * @param  version
   * @return         [description]
   */
  async doneSetVersion(version, action) {
    let self = this;
    let images = version.versionData;
    self.latestVersionCatchData = images;
    if (self.select) {
      self.select.getFeatures().clear();
      self.mergepolygonNewFeature = null;
      self.num = 0;
    } else {
      self.clearBreakupmodel();
    }

    //
    // let index = self.historyVersion.indexOf(version)
    // let nextVersion
    // if(action === 'undo'){
    //   nextVersion = self.historyVersion[index-1]
    // }else if(action === 'redo'){
    //   nextVersion = self.historyVersion[index+1]
    // }
    // console.log(index, self.nowVersion, '/index');

    // TODO: version adn nextVersion 及 mapData 相互补充
    for (let i = 0; i < images.length; i++) {
      let layerData = images[i].catchImage.data;
      let data = new GeoJSON().readFeatures(layerData);
      let currentLayer = self.map.getLayers().array_[images[i].pIndex + 1];
      let name = images[i].catchImage.name;
      name = name.slice(name.indexOf("_") + 1, name.lastIndexOf("."));

      let source = new VectorSource({
        features: data
      });
      self.resetDataStructure(source.getFeatures(), name, images[i].pIndex);
      currentLayer.setSource(source);
      // let geojson = (new GeoJSON()).readFeatures(geoJson)
      // console.log(data);
    }

    // console.log(self.num,self.mergepolygonNewFeature );
  }
  getRowAndColByIndex(pIndex) {
    let self = this;
    let rowNum = Math.ceil((pIndex + 1) / self.colLength) - 1;
    let colNum = pIndex % self.colLength;
    if (pIndex !== 0) {
      colNum = (pIndex % self.colLength) + 1;
    }

    let data = {
      row: rowNum < 0 ? 0 : rowNum,
      col: colNum - 1 < 0 ? 0 : colNum - 1
    };
    return data;
  }
  getGeometryData(featrues) {
    let geoJsonData = [];
    for (let i = 0; i < featrues.length; i++) {
      let item = featrues[i];
      let geojson = item.getGeometry(item);
      let coordinate = geojson.getCoordinates();
      let oneFeature = {
        type: "Feature",
        properties: {
          value: i
        },
        geometry: {
          coordinates: coordinate,
          type: "Polygon"
        }
      };
      geoJsonData.push(oneFeature);
    }
    return geoJsonData;
  }
  removeIniterActions() {
    let self = this;
    self.map.removeInteraction(self.snap);
    self.map.removeInteraction(self.modify);
    self.map.removeInteraction(self.draw);
    self.breakupLine = this.breakPolygeon1 = this.breakPolygeon2 = [];
    // console.log('it is working');
  }

  // 拆分 划线
  breakUpModel() {
    let self = this;
    self.showBreakActive = true;
    self.showFusionActive = false;
    self.showRestoreActive = false;
    if (self.select) {
      self.select.getFeatures().clear();
      self.select = null;
    }
    if (!self.selectPointerMove) {
      self.selectPointerMove = new Select({
        condition: click,
        wrapX: false,
        style: new Style({
          stroke: new Stroke({
            color: "yellow",
            lineDash: [0],
            width: 3
          }),
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)"
          })
        })
      });
    }

    self.map.addInteraction(self.selectPointerMove);
    self.selectPointerMove.on("select", function(e) {
      // clearInterval(self.timeSet)
      // try{
      let currentLayer = e.target.getOverlay();
      // console.log(currentLayer,'/currentLayer');
      let source = currentLayer.getSource();

      // 选择区域
      let feature = e.target
        .getOverlay()
        .getSource()
        .getFeatures();
      // source.removeFeature(feature[0])
      self.feature = feature;

      self.drawLine(source, feature);
      // }catch(e){
      //
      // }
    });
  }
  // 去重 合并
  // breakUpSelected(){
  //   let self = this
  //   self.selectPointerMove.on('select', function(e) {
  //     let currentLayer = e.target.getOverlay()
  //     // console.log(currentLayer,'/currentLayer');
  //     let source = currentLayer.getSource()
  //
  //     // 选择区域
  //     let feature = e.target.getOverlay().getSource().getFeatures()
  //     // source.removeFeature(feature[0])
  //     self.feature = feature
  //
  //     self.drawLine(source, feature)
  //
  //   });
  // }
  findFeatureInJson(pIndex) {
    let self = this;
    let mapLayers = self.map.getLayers();
    let currentLayer = mapLayers.array_[pIndex + 1];
    let theJsonFileFeatures = currentLayer.getSource().getFeatures();
    return theJsonFileFeatures;
  }
  drawLine(source, featur) {
    let self = this;
    let drawing = false;
    let drawing_feature;

    self.draw = new Draw({
      source: source,
      type: "LineString",
      minPoints: 2,
      snapTolerance: 10,
      stopClick: true,
      style: new Style({
        stroke: new Stroke({
          color: "yellow",
          lineDash: [0],
          width: 3
        }),
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.3)"
        })
      })
    });

    var keydown = function(evt) {
      var charCode = evt.which ? evt.which : evt.keyCode;
      // console.log(evt, '///evt');
      if (charCode === 27 && drawing === true) {
        //esc key
        //dispatch event
        self.draw.set("escKey", Math.random());
      }
    };
    self.mouseClickEvt = evt => {
      if (evt.which === 1 && drawing === true) {
        self.draw.set("click", Math.random());
      }
    };
    document.addEventListener("keydown", keydown, false);

    self.draw.set("escKey", "");

    // 仅选择区域内划线
    // document.addEventListener('click', self.mouseClickEvt, false)
    // self.draw.set('click', '')
    //
    // self.draw.on('change:click', (event)=>{
    //
    //   try{
    //     let currentSelected = self.selectPointerMove.getFeatures().array_
    //     let selectedPolygon = currentSelected[0].getGeometry()
    //     let selectedCoordinatres = selectedPolygon.getCoordinates()[0]
    //     let features = event.target.getOverlay().getSource().getFeatures()
    //     let lineCoors = features[0].getGeometry().getCoordinates()
    //     let pointerCoors = features[1].getGeometry().getCoordinates()
    //     lineCoors = self.arrayUniQue(lineCoors)
    //
    //     let hasPoint = self.hasPoint(pointerCoors, selectedCoordinatres)
    //
    //     let innerPolygon = selectedPolygon.intersectsCoordinate(pointerCoors)
    //
    //     if(lineCoors.length === 1 && !hasPoint){
    //       alert('拆分起点应在选中地块边缘坐标点上')
    //       self.draw.removeLastPoint()
    //       // return
    //     }else if(lineCoors.length > 1 && !innerPolygon){
    //       alert('结束点应在选中地块边缘坐标点上')
    //       self.draw.removeLastPoint()
    //     }else if(lineCoors.length > 1 && hasPoint){
    //       self.draw.finishDrawing()
    //       document.removeEventListener('click', self.mouseClickEvt , false)
    //     }
    //   }catch(e){
    //     // self.clearBreakupmodel()
    //     console.log(e);
    //   }
    // })

    self.draw.on("drawstart", function(evt) {
      drawing = true;
      drawing_feature = evt.feature;
      // console.log(evt, '///');
    });
    // 绘制完成
    self.draw.on("drawend", function(event) {
      // console.log(event);
      drawing = false;
      drawing_feature = null;

      self.breakupLine = self.arrayUniQue(
        event.feature.getGeometry().getCoordinates()
      );
      let currentSelected = self.selectPointerMove.getFeatures().array_;
      if (currentSelected.length) {
        let selectedPolygon = currentSelected[0].getGeometry();
        let selectedCoordinatres = selectedPolygon.getCoordinates()[0];
        let startPoint = self.hasPoint(
          self.breakupLine[0],
          selectedCoordinatres
        );
        let endPoint = self.hasPoint(
          self.breakupLine[self.breakupLine.length - 1],
          selectedCoordinatres
        );

        // let innerPolygon = selectedPolygon.intersectsCoordinate(self.breakupLine[self.breakupLine.length - 1])
        // console.log(innerPolygon, '///innerPolygon');

        // console.log(currentSelected, selectedCoordinatres, startPoint, endPoint, '////');
        // Important Tip : need to fix ol bug
        // node_modules/ol/PluggableMap.js 928 931 判断 interaction是否存在
        // 精确判断起始点是否在原坐标系内
        if (startPoint || endPoint) {
          self.getBreakUpCoordinates(
            featur[0].getGeometry().getCoordinates()[0]
          );
          if (self.breakPolygeon1.length || self.breakPolygeon2.length) {
            self.sureDone();
          } else {
            self.clearBreakupmodel();
          }
        } else {
          self.clearBreakupmodel();
        }
      }

      // 根据点击位置 显示按钮
      // let top_left = event.target.downPx_
      // self.btnStyle = {
      //   top: top_left[1] - 50 + 'px',
      //   left: top_left[0] - 40 + 'px'
      // }
      // console.log(featur[0].getGeometry(),self.breakupLine, '////line info' );
    });

    self.draw.on("change:escKey", function(evt) {
      self.draw.removeLastPoint();
    });

    self.modify = new Modify({ source: source });
    self.snap = new Snap({ source: source });

    self.map.addInteraction(self.modify);
    self.map.addInteraction(self.draw);
    self.map.addInteraction(self.snap);
    // self.draw.finishDrawing()
  }
  /**
   *
   * @param point 判断point是否在直线上
   * @param lineStart
   * @param lineEnd
   */
  pointOnline(point, lineStart, lineEnd) {
    let Xline = lineEnd.x - lineStart.x;
    let Yline = lineEnd.y - lineStart.y;
    let xPoint = point.x - lineStart.x;
    let yPoint = point.y - lineStart.y;
    let reslut = Xline * yPoint - xPoint * Yline;
    if (reslut !== 0) {
      return false;
    } else {
      // 判断点是否是在该线的延长线上
      let xMin = Math.min(lineStart.x, lineEnd.x);
      let xMax = Math.max(lineEnd.x, lineStart.x);
      let yMin = Math.min(lineStart.y, lineEnd.y);
      let yMax = Math.max(lineEnd.y, lineStart.y);
      if (
        xMin <= point.x &&
        point.x <= xMax &&
        yMin <= point.y &&
        point.y <= yMax
      )
        return true;
      else return false;
    }
  }
  // 判断是否在边界
  hasPoint(point, polygon) {
    let result = false;
    for (let i = 0; i < polygon.length; i++) {
      let item = polygon[i];
      if (item[0] === point[0] && item[1] === point[1]) {
        result = true;
      }
    }
    return result;
  }
  // 获取拆分坐标
  getBreakUpCoordinates(featureCoordinates) {
    let self = this;
    if (self.breakupLine.length) {
      let intersection = [];
      for (let j = 0; j < self.breakupLine.length; j++) {
        let linePoint = self.breakupLine[j];
        for (let i = 0; i < featureCoordinates.length; i++) {
          let item = featureCoordinates[i];
          if (item[0] === linePoint[0] && item[1] === linePoint[1]) {
            intersection.push(i);
          }
        }
      }
      // 根据相交坐标拆分原坐标数组
      for (let n = 0; n < intersection.length - 1; n++) {
        let start = intersection[n];
        let end = intersection[n + 1];
        let oldCoordinateStart = [];
        let oldCoordinateNext = [];
        let secondPolygeon = [];

        // if(end && end !== undefined){
        if (start < end) {
          // console.log(start, end, 'start small');

          oldCoordinateStart = featureCoordinates.slice(start, end);

          oldCoordinateNext = featureCoordinates.slice(
            end,
            featureCoordinates.length
          );

          secondPolygeon = featureCoordinates.slice(0, start);

          self.breakPolygeon1 = oldCoordinateStart.concat(
            self.breakupLine.reverse()
          );
          // oldCoordinateNext).concat(self.breakupLine.slice(1,self.breakupLine.length).reverse()
          self.breakPolygeon2 = oldCoordinateNext
            .concat(secondPolygeon)
            .concat(self.breakupLine.reverse());
        } else {
          oldCoordinateStart = featureCoordinates.slice(
            start,
            featureCoordinates.length
          );
          oldCoordinateNext = featureCoordinates.slice(0, end);

          secondPolygeon = featureCoordinates.slice(end, start);
          self.breakPolygeon1 = oldCoordinateStart
            .concat(oldCoordinateNext)
            .concat(
              self.breakupLine.slice(1, self.breakupLine.length).reverse()
            );
          self.breakPolygeon2 = secondPolygeon.concat(
            self.breakupLine.slice(0, self.breakupLine.length - 1)
          );

          // console.log(start, end , 'end small');
        }
        // 拆分新图形绘制测试

        // }else{
        //   console.log(end);
        //   self.showSure = false
        //   // self.showBtns = false
        //   alert('提示：拆分起、始点一定要与原图像坐标点相交')
        //   return
        // }
      }
    }
  }
  getFeatureByCoordinats(points, name, pIndex, index) {
    let newPolygon = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [points]
      }
    };
    let GeoJsonOjb = new GeoJSON();
    let feature = GeoJsonOjb.readFeatures(newPolygon);
    feature[0].values_.pName = name;
    feature[0].values_.pIndex = pIndex;
    feature[0].values_.index = index;
    return feature;
  }

  // 图形绘制测试
  addLayerFun(points, style) {
    let newPolygon = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [points]
      }
    };
    var source = new VectorSource({
      features: new GeoJSON().readFeatures(newPolygon)
    });
    var layer = new VectorLayer({
      source: source,
      style: style
      // style: self.styles['Polygon']
    });
    this.map.addLayer(layer);
    return layer;
  }
  // 合并模式
  fusion() {
    let self = this;
    self.showBreakActive = false;
    self.showRestoreActive = false;
    self.showFusionActive = true;
    // console.log(self.select);
    self.unModify();
    self.selectPolygon();
  }
  showHistory() {
    let self = this;

    self.showRestoreActive = true;
    self.showBreakActive = false;
    self.showFusionActive = false;
    self.unModify();
    if (self.select) {
      self.select.getFeatures().clear();
      self.map.removeInteraction(self.select);
      self.select = null;
    }
  }
  closeHistory() {
    this.showRestoreActive = false;
  }
  unBindModel() {
    let self = this;
    self.showBreakActive = false;
    self.showFusionActive = false;
    self.showRestoreActive = false;
    self.unModify();
    if (self.select) {
      self.select.getFeatures().clear();
      self.map.removeInteraction(self.select);
      self.select = null;
    }
    // console.log(self.select, 'get select');
  }
  // 移除拆分模式
  unModify() {
    let self = this;
    // console.log(!self.draw);
    if (self.draw) {
      self.map.removeInteraction(self.draw);
      // self.draw = null
    }
    // console.log(self.snap);
    if (self.snap) {
      self.map.removeInteraction(self.snap);
    }
    if (self.modify) {
      self.map.removeInteraction(self.modify);
    }
    // console.log(self.selectPointerMove);
    if (self.selectPointerMove) {
      self.selectPointerMove.getFeatures().clear();
      self.map.removeInteraction(self.selectPointerMove);
      self.selectPointerMove = null;
    }
  }
  async initMap() {
    let self = this;
    var image = new CircleStyle({
      radius: 5,
      fill: null,
      stroke: new Stroke({ color: "red", width: 1 })
    });

    var styleFunction = function(feature) {
      let style = self.styles[feature.getGeometry().getType()];
      return style;
    };

    // https://skypulischinanorth.blob.core.chinacloudapi.cn/public/demo/bingmap/Fargo_L13_s3_edit/metadata.json
    let metaDataUrl =
      "https://skypulis1chinanorth2.blob.core.chinacloudapi.cn/public/demo/bingmap/Pinggu_L15_s3_edit/metadata.json";
    if (self.siteUrl && self.service) {
      metaDataUrl = self.siteUrl + "/" + self.service + "/metadata.json";
    }
    let metaData = await this.getMetaData(metaDataUrl);
    self.imagesData = await this.getImagesUrls(metaData.images);
    self.rowLength = metaData.images.length;
    self.colLength = metaData.images[0].length;
    self.mapLayers = [
      new TileLayer({
        // source: new OSM(),
        // bing map
        source: new BingMaps({
          key:
            "AopmtyApcdbefoeVW-LwENG5VhXWvi7_qJ4-C2AYwMR_GVmxCy2A4lCBOKhna761",
          imagerySet: "Aerial"
        }),
        preload: Infinity
      })
    ];
    IndexedDB.clearAll("mapData");
    IndexedDB.clearAll("catchMap");
    self.imagesData.forEach(async (item, index) => {
      let getSources = new VectorSource({
        url: item.url,
        format: new GeoJSON()
      });

      // reset data structure
      var listenerKey = getSources.on("change", function(e) {
        if (getSources.getState() == "ready") {
          self.resetDataStructure(getSources.getFeatures(), item.name, index);
          let pointer = self.getRowAndColByIndex(index);
          let onCatch = {
            pIndex: index,
            catchImage: {
              name: "contour_" + item.name + ".json",
              row: pointer.row,
              col: pointer.col,
              data: {
                type: "FeatureCollection",
                features: self.getGeometryData(getSources.getFeatures())
              }
            }
          };
          IndexedDB.backUpMapData(onCatch);
        }
      });

      let layer = new VectorLayer({
        source: getSources,
        style: styleFunction
      });
      this.mapLayers.push(layer);
    });

    let lat = (metaData.minlat + metaData.maxlat) / 2.0;
    let lon = (metaData.minlon + metaData.maxlon) / 2.0;
    let scale = metaData.scale || 1;
    let level = metaData.level;
    this.lanchMap(lat, lon, scale, level);
    // this.addlayertest();
  }
  addlayertest() {
    var styles = [
      /* We are using two different styles for the polygons:
       *  - The first style is for the polygons themselves.
       *  - The second style is to draw the vertices of the polygons.
       *    In a custom `geometry` function the vertices of a polygon are
       *    returned as `MultiPoint` geometry, which will be used to render
       *    the style.
       */
      new Style({
        stroke: new Stroke({
          color: "blue",
          width: 1
        }),
        fill: new Fill({
          color: "rgba(255, 0, 255, 0.4)"
        })
      }),
      new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({
            color: "orange"
          })
        }),
        geometry: function(feature) {
          // return the coordinates of the first ring of the polygon
          var coordinates = feature.getGeometry().getCoordinates()[0];
          return new MultiPoint(coordinates);
        }
      })
    ];

    var geojsonObject = {
      type: "FeatureCollection",
      crs: {
        type: "name",
        properties: {
          name: "EPSG:3857"
        }
      },
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [117.09572374820709, 40.196859674703475],
                [117.095707654953, 40.196863772214314],
                [117.09569692611694, 40.19687196723523],
                [117.09568619728088, 40.19688016225517],
                [117.09567546844482, 40.19688835727411],
                [117.09569424390793, 40.19688016225517],
                [117.09542423486708, 40.19693411277835],
                [117.0953643321991, 40.19690474730902],
                [117.09532678127289, 40.19643489807041],
                [117.09531605243683, 40.19625460621919],
                [117.09442555904388, 40.19598280168893],
                [117.09442019462585, 40.19597870412486],
                [117.0944094657898, 40.19597870412486],
                [117.09442019462585, 40.19597870412486],
                [117.09525346755983, 40.19566728853116],
                [117.09555745124817, 40.19566728853116],
                [117.09532678127289, 40.19643489807041],
                [117.09532678127289, 40.19643489807041]
              ]
            ]
          }
        }
      ]
    };

    var source = new VectorSource({
      features: new GeoJSON().readFeatures(geojsonObject)
    });

    var layer = new VectorLayer({
      source: source,
      style: styles
    });
    this.map.addLayer(layer);
  }
  // 添加feature与*.json文件关联信息
  resetDataStructure(features, name, index) {
    for (let i = 0; i < features.length; i++) {
      let item = features[i];
      item.values_.pName = name;
      item.values_.pIndex = index;
      item.values_.index = i;
    }
    return features;
  }
  async lanchMap(lat, lon, scale, level) {
    let self = this;
    if (self.mapLayers.length) {
      let view = new View({
        // projection：坐标系 ，必须设置
        projection: "EPSG:4326",
        center: [lon, lat],
        zoom: level,
        minZoom: level - 3,
        maxZoom: level + scale - 1
      });

      var map = new Map({
        layers: self.mapLayers,
        target: "map",
        view: view,
        controls: []
      });
      if (self.map === null) {
        self.map = map;
      }
    }

    let catchData = await IndexedDB.getAllFun();
    self.historyVersion = catchData.reverse();
    if (catchData.length) {
      self.latestVersionCatchData = catchData[0].versionData;
    }
    self.timeSet = setInterval(() => {
      self.updateImage(false);
    }, 1000 * 60);
  }
  keyEventsFun() {
    console.log("come here it is working", "////");
  }
  // bind events 选择图形
  selectPolygon() {
    let self = this;
    // var select = null
    // var selectSingleClick = new Select()
    // click
    if (!self.select) {
      self.select = new Select({
        condition: click,
        multi: true,
        wrapX: false,
        style: new Style({
          stroke: new Stroke({
            color: "red",
            lineDash: [0],
            width: 1
          }),
          fill: new Fill({
            color: "rgba(255, 0, 0, 0.3)"
          })
        })
      });
    }
    self.map.addInteraction(self.select);

    self.select.on("select", function(e) {
      // 选择区域
      // clearInterval(self.timeSet)
      let tempArr = [];
      let deselectNum = e.deselected.length;
      let selectedItem = e.selected;
      // console.log(self.num,self.mergepolygonNewFeature, '///selected');
      // old shift + click selected item
      // TODO: 第一次点击记录选中Feature,第二次点击 将与第一次选中Feature合并
      if (self.num > 1 && self.mergepolygonNewFeature) {
        tempArr.push(self.mergepolygonNewFeature);
        tempArr.push(selectedItem);
      } else if (deselectNum) {
        tempArr.push(e.deselected);
        tempArr.push(selectedItem);
      }
      if (tempArr.length > 1) {
        self.nowVersion = 0;
        self.mergePolygons(tempArr, e);
      }

      self.num++;
    });
  }
  // 合并
  mergePolygons(features, e) {
    // var parser = new jsts.io.OL3Parser();
    // parser.inject(Point, LineString, LinearRing, Polygon, MultiPoint, MultiLineString, MultiPolygon);

    let pointers = [];

    for (var i = 0; i < features.length; i++) {
      var feature = features[i][0];
      try {
        if (feature.getGeometry()) {
          let points = feature.getGeometry().getCoordinates();
          pointers.push(points);
        }
      } catch (e) {
        // 拦截feature 不正常情况
        return false;
      }
    }

    this.contrast(pointers, features, e);
  }
  contrast(arr, features, e) {
    let self = this;
    let tempArr = [];
    let nearByArr1Point = [];
    let nearByArr2Point = [];
    let newPolygon = [];
    // for(let i = 0; i < arr.length; i++){
    let arr1;
    let arr2;
    try {
      arr1 = arr[0][0];
    } catch (e) {
      console.log(e);
      return false;
      // alert("1231")
    }

    try {
      arr2 = arr[1][0];
    } catch (e) {
      console.log(e);
      return false;
      // alert('2222')
    }
    let descs = [];
    for (let i = 0; i < arr1.length; i++) {
      for (let j = 0; j < arr2.length; j++) {
        // ol shpere 获取坐标之间距离
        // let juli = getDistance(arr1[i], arr2[j], 4326)
        // descs.push(juli)

        let latPoor = Math.pow(
          parseFloat(arr1[i][0]) - parseFloat(arr2[j][0]),
          2
        );
        let lonPoor = Math.pow(
          parseFloat(arr1[i][1]) - parseFloat(arr2[j][1]),
          2
        );
        let des = Math.sqrt(latPoor + lonPoor);

        // let latPoor = Math.abs(parseFloat(arr1[i][0] - parseFloat(arr2[j][0]))
        // let lonPoor = Math.abs(parseFloat(arr1[i][1]) - parseFloat(arr2[j][1]))

        if (des < Math.pow(10, -5)) {
          nearByArr1Point.push(arr1[i]);
          nearByArr2Point.push(arr2[j]);
        }
      }
    }
    // console.log(descs.sort());
    // }
    if (nearByArr1Point.length && nearByArr2Point.length) {
      nearByArr1Point = self.arrayUniQue(nearByArr1Point);
      nearByArr2Point = self.arrayUniQue(nearByArr2Point);

      console.log("图形1,相邻坐标：", nearByArr1Point);
      console.log("图形2, 相邻坐标：", nearByArr2Point);
      let newArr1 = self.refetchArray(
        self.getNearByIndex(arr1, nearByArr1Point),
        self.getNearByIndex(arr2, nearByArr2Point)
      );
      // let newArr2 = self.unionArrItem(self.getNearByIndex(arr2, nearByArr2Point))

      let allPoints = newArr1;
      let newPolygon = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [allPoints]
        }
      };
      var source = new VectorSource({
        features: new GeoJSON().readFeatures(newPolygon)
      });
      var layer = new VectorLayer({
        source: source,
        style: new Style({
          stroke: new Stroke({
            color: "green",
            lineDash: [0],
            width: 1
          }),
          fill: new Fill({
            color: "rgba(0, 255, 255, 0.8)"
          })
        })
        // style: self.styles['Polygon']
      });
      // 先预览合并后的新图块，在选择是否合并
      // self.map.addLayer(layer)

      // setTimeout(function () {
      self.doFusion(layer, features, e);
      // }, 500)
    } else {
      // alert('请选择相邻区域进行合并')
      self.mergepolygonNewFeature = null;
      self.num = 0;
      return;
    }
    // self.select.getFeatures().clear()
  }
  arrayUniQue(arr) {
    var result = [],
      hash = {};
    for (var i = 0; i < arr.length; i++) {
      if (!hash[arr[i]]) {
        result.push(arr[i]);
        hash[arr[i]] = true;
      }
    }
    return result;
  }
  // 确认并合并图层
  doFusion(layer, features, e) {
    let self = this;
    // if(confirm(msg)){
    // currLayer.getSource().clear(true)

    // 获取选择合并两个图形feature所在*.json文件
    let pIndex;
    let currentJsonQuery = [];
    let indexForRestore = "";
    for (let i = 0; i < features.length; i++) {
      let item = features[i][0];
      let name = item.get("pName");
      pIndex = item.get("pIndex");
      let index = item.get("index");
      indexForRestore += index + ",";
      let currentjson = self.findFeatureInJson(pIndex);
      let obj = {
        name,
        pIndex,
        index,
        currentjson
      };
      currentJsonQuery.push(obj);
    }
    let newFeature = layer.getSource().getFeatures()[0];
    let featuresJsonFile = currentJsonQuery[0].currentjson;
    let oldData = {
      pIndex,
      geoJsonFile: {
        type: "FeatureCollection",
        features: self.getGeometryData(featuresJsonFile)
      }
    };
    let oldFeature1Index = currentJsonQuery[0].index;
    let oldFeature2Index = currentJsonQuery[1].index;
    // console.log('原Image Feature数量', featuresJsonFile.length);
    if (oldFeature1Index < oldFeature2Index) {
      featuresJsonFile.splice(oldFeature2Index, 1);
      featuresJsonFile.splice(oldFeature1Index, 1);
    } else {
      featuresJsonFile.splice(oldFeature1Index, 1);
      featuresJsonFile.splice(oldFeature2Index, 1);
    }
    featuresJsonFile.push(newFeature);
    let fIndex = featuresJsonFile.indexOf(newFeature);
    // self.select.deselected.push(newFeature)
    // console.log(self.select, '////');
    let geoJson = {
      type: "FeatureCollection",
      features: self.getGeometryData(featuresJsonFile)
    };
    let newPloygonArea = Math.abs(newFeature.getGeometry().getArea());
    let oldPloygonArea =
      Math.abs(features[0][0].getGeometry().getArea()) +
      Math.abs(features[1][0].getGeometry().getArea());

    if (newPloygonArea >= oldPloygonArea) {
      self.saveJsonFile(
        currentJsonQuery[0].name,
        geoJson,
        currentJsonQuery[0].pIndex,
        indexForRestore,
        oldData,
        [layer.getSource().getFeatures()],
        features
      );
    } else {
      self.mergepolygonNewFeature = null;
    }

    // console.log(layer, 'get layer');

    //
    // }else{
    //   console.log('cancle');
    //   self.map.removeLayer(layer)
    //   self.select.getFeatures().clear()
    //
    // }
  }
  getNearByIndex(arr, nearArr) {
    let start = null;
    let end = null;
    let obj = {};
    // 移除相邻距离 坐标
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === nearArr[0]) {
        start = i;
      }
      if (arr[i] === nearArr[nearArr.length - 1]) {
        end = i;
      }
    }
    if (start !== null && end !== null) {
      obj = {
        start,
        end,
        arr,
        length: nearArr.length
      };
    }
    console.log(obj, "/////");

    return obj;
  }
  polygonMerge(obj, second) {
    let arr = obj.arr;
    let arrFront = [];
    let arrEnd = [];
    if (obj.start === 0) {
      arrFront = arr.slice(0, obj.end);
      arrEnd =
        obj.end < arr.length
          ? arr.slice(second ? obj.end + 1 : obj.end, arr.length)
          : [];
    } else if (obj.start < obj.end) {
      // 0 < obj.start < obj.end
      arrFront = arr.slice(0, obj.start);
      arrEnd = arr.slice(second ? obj.start + 1 : obj.start, obj.end);
      // arr.length > obj.end?
    } else {
      // obj.start > obj.end
      arrFront = arr.slice(0, obj.end);
      arrEnd = arr.slice(second ? obj.start + 1 : obj.start, arr.length);
      // obj.start < arr.length ?
    }
    return { arrFront, arrEnd };
  }
  // 合并两个图形坐标，得到新图形坐标
  refetchArray(obj, obj2) {
    // console.log(obj.start, obj.end, obj.length);
    let arr = obj.arr;
    let arrFront = null;
    let arrEnd = null;
    let newArr = [];

    if (obj.start < obj.end) {
      arrFront = arr.slice(0, obj.start);
      arrEnd = arr.slice(obj.end, arr.length);
    } else {
      arrFront = arr.slice(obj.start, arr.length);
      arrEnd = arr.slice(0, obj.end);
    }
    // TODO: 处理合并块数据截取、重组
    let arr2 = obj2.arr;
    let arrFront2 = null;
    let arrEnd2 = null;
    if (obj2.start < obj2.end) {
      arrFront2 = arr2.slice(0, obj2.start);
      arrEnd2 = arr2.slice(obj2.end, arr2.length);
    } else {
      arrFront2 = arr2.slice(obj2.start, arr2.length);
      arrEnd2 = arr2.slice(0, obj2.end);
    }

    // let polygon1 = this.polygonMerge(obj, false);
    // let polygon2 = this.polygonMerge(obj2, true);
    // console.log(polygon1, polygon2, "///polygon2");

    console.log("合并前 第一块图坐标：", arr);
    console.log("合并前，第二块坐标：", arr2);
    // arrEnd2 取倒叙 reverse()
    newArr = arrFront
      .concat(arrFront2)
      .concat(arrEnd2)
      .concat(arrEnd);

    console.log("合并后的坐标：", newArr);
    return newArr;
  }
  async getfeatures(geoJson) {
    return new GeoJSON().readFeatures(geoJson);
  }
  async getMetaData(url) {
    let self = this;
    let metaData = await http.get(url);
    return metaData;
  }
  getImagesUrls(images) {
    let self = this;
    let genJsonUrl =
      "https://skypulis1chinanorth2.blob.core.chinacloudapi.cn/public/demo/bingmap/Pinggu_L15_s3_edit/contour_";
    if (self.siteUrl && self.service) {
      genJsonUrl = self.siteUrl + "/" + self.service + "/contour_";
    }
    // let geoJsonData = []
    let imagesUrl = [];
    images.forEach(image => {
      image.forEach(item => {
        let name = item.image.slice(0, item.image.indexOf("."));
        let url = genJsonUrl + name + ".json";
        let oneItem = {
          url,
          name
        };
        imagesUrl.push(oneItem);
        // let geoJson = await this.getGeoJsonData(url)
        // geoJsonData.push(geoJson.data)
      });
    });
    // console.log(geoJsonData, '///');

    return imagesUrl;
  }
  async getGeoJsonData(url) {
    let geoJson = await http.get(url);
    return geoJson;
  }
}
