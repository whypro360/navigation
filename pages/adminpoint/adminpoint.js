const getAllPointModule = require('../../utils/getAllpoint');
const getAllPathModule = require('../../utils/getAllPath');
const app = getApp();
const { request } = require("../../utils/request");
Page({
  data: {
    points: [], // 所有的点位信息
    paths: [],  // 所有的路径信息
    pathMap: {}, // 根据起点ID分组的终点列表
    selectedPointIndex: null, // 当前选中的起点索引
    selectedStartPointIndex:null,// 当前选中的起点索引
    selectedEndPointIndex: null, // 当前选中的终点索引
    startPointSelected:false,
    longitude: 120.1234567, // 地图中心经度
    latitude: 30.1234567, // 地图中心纬度
    markers: [], // 地图上的标记
    polyline: [], // 地图上的路径线
    showForm: false,//点位表单展示
    showPathForm: false,//路径表单展示
    newPoint: null,
    type: '',
    endPoints: [],  // 确保初始化为空数组
    newPath:null
  },

  onLoad:async function (options) {
    const points = await getAllPointModule.fetchAllPoint();
    const paths = await getAllPathModule.fetchAllPath();
    // 构建pathMap
    let pathMap = {};
    paths.forEach(path => {
      if (!pathMap[path.startPointId]) {
        pathMap[path.startPointId] = [];
      }
      const endPoint = points.find(p => p.id === path.endPointId);
      if (endPoint) {
        pathMap[path.startPointId].push(endPoint);
      }
    });
    const startPointIds = Object.keys(pathMap).map(Number);
    const startPoints = points.filter(p => startPointIds.includes(p.id));
    this.setData({
      points,
      paths,
      startPoints,
      pathMap,
      type : options.type
    });
  },

  onStartPointChange(e) {
    const index = e.detail.value;
    const startPoint = this.data.points[index];
    const endPoints = this.data.pathMap[startPoint.id] || [];

    this.setData({
      selectedStartPointIndex: index,
      endPoints,
      startPointSelected:true
    });
  },

  onEndPointChange(e) {
    const index = e.detail.value;
    const startPoint = this.data.points[this.data.selectedStartPointIndex];
    const endPoint = this.data.endPoints[index];
    this.setData({
      latitude:(endPoint.latitude+startPoint.latitude)/2,
      longitude:(endPoint.longitude+startPoint.longitude)/2,
      selectedEndPointIndex: index,
      markers: this.getMarkers(startPoint, endPoint),
      polyline: this.getPathLine(startPoint, endPoint)
    });
    this.openPathForm();
  },

  getMarkers: function(startPoint, endPoint) {
    return [
      {
        id: startPoint.id,
        longitude: startPoint.longitude,
        latitude: startPoint.latitude,
        name: startPoint.name,
        width:20,
        height:20,
        iconPath: '/images/start.png'
      },
      {
        id: endPoint.id,
        longitude: endPoint.longitude,
        latitude: endPoint.latitude,
        name: endPoint.name,
        width:20,
        height:20,
        iconPath: '/images/end.png'
      }
    ];
  },

  getPathLine: function(startPoint, endPoint) {
    return [{
      points: [
        {longitude: startPoint.longitude, latitude: startPoint.latitude},
        {longitude: endPoint.longitude, latitude: endPoint.latitude}
      ],
      color: '#FF0000DD',
      width: 4,
      borderColor: "#FFFFFF",
      borderWidth: 1
    }];
  },


  bindPickerChange: function (e) {
    this.setData({
      selectedPointIndex: e.detail.value
    }, () => {
      this.updateMarkers();
    });
  },
  updateMarkers: function () {
    const selectedPoint = this.data.points[this.data.selectedPointIndex];
    this.setData({
      newPoint:selectedPoint,
      longitude: selectedPoint.longitude,
      latitude: selectedPoint.latitude,
      markers: [{
        id: selectedPoint.id,
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        width:20,
        height:20,
        title: selectedPoint.name
      }]
    });
  },

  onMarkerTap(){
    var type = this.data.type
    if (type == "point"){
      this.setData({
        showForm:true
      })
    }else{
      this.setData({
        showPathForm: true
      })
    }

  },

  closeForm() {
    this.setData({ showForm: false });
  },

  onNameInput(e) {
    const newPoint = this.data.newPoint
    newPoint.name = e.detail.value;
    this.setData({ newPoint });
  },

  onLongitudeInput(e) {
    const newPoint = this.data.newPoint
    newPoint.longitude = parseFloat(e.detail.value);
    this.setData({ newPoint });
  },

  onLatitudeInput(e) {
    const newPoint = this.data.newPoint
    newPoint.latitude = parseFloat(e.detail.value);
    this.setData({ newPoint });
  },

  toggleStatus(e) {
    const newPoint = this.data.newPoint
    newPoint.status = e.detail.value ? 1 : 0;
    this.setData({ newPoint });
  },

  onDescriptionInput(e) {
    const newPoint = this.data.newPoint
    newPoint.description = e.detail.value;
    this.setData({ newPoint });
  },
  // 打开路径表单
  openPathForm() {
    const { startPoints, selectedStartPointIndex, endPoints, selectedEndPointIndex, points, paths } = this.data;

    // 获取起点和终点名称
    const startName = startPoints[selectedStartPointIndex]?.name || '';
    const endName = endPoints[selectedEndPointIndex]?.name || '';
    
    // 获取起点坐标
    const startLat = startPoints[selectedStartPointIndex]?.latitude;
    const startLng = startPoints[selectedStartPointIndex]?.longitude;
    
    // 获取终点坐标
    const endLat = endPoints[selectedEndPointIndex]?.latitude;
    const endLng = endPoints[selectedEndPointIndex]?.longitude;
    
    const startPoint = points.find(p => p.latitude === startLat && p.longitude === startLng);
    // console.log("this is a startPoint",startPoint)
    const startPointId = startPoint?.id;
    
    const endPoint = points.find(p => p.latitude === endLat && p.longitude === endLng); 
    // console.log("this is a endPoint",endPoint)
    const endPointId = endPoint?.id;
    
    // 根据 startPointId 和 endPointId 查找路径
    const path = paths.filter(p => p.startPointId === startPointId && p.endPointId === endPointId);
    
    console.log("this is a path", path);
    this.setData({
      newPath: {
        startName,
        endName,
        startPointId:path[0].startPointId,
        startLatitude: startLat,
        startLongitude: startLng,
        endPointId:path[0].endPointId,
        endLatitude: endLat,
        endLongitude: endLng,
        status: path[0].pathStatus,
        id : path[0].id,
        distance: path[0].distance
      }
    });
  },
   // 关闭路径表单
   closePathForm() {
    this.setData({
      showPathForm: false
    });
  },
    // 切换路径状态
  togglePathStatus(e) {
    const checked = e.detail.value;
    this.setData({
      'newPath.status': checked ? 1 : 0
    });
  },

  // 路径描述输入
  onDescriptionPathInput(e) {
    this.setData({
      'newPath.description': e.detail.value
    });
  },

  async pathFormSubmit() {
    try{
      console.log('表单数据提交:', this.data.newPath);
      const newPath = this.data.newPath
      wx.showLoading({
        title: '更新点位数据中...',
      })
      await request({
        url: app.globalData.URL + "admin/path",
        method: "POST",
        data:{
          id : newPath.id,
          startPointId:newPath.startPointId,
          endPointId:newPath.endPointId,
          distance:newPath.distance,
          pathStatus:newPath.status
        } 
      })
      wx.showToast({
        title: '上传成功！'
      })
      const paths =await getAllPointModule.fetchAllPath()
      this.setData({ paths ,showPathForm:false})
      this.closeForm();
    } catch (err) {
      console.error('表单提交失败:', err);
      wx.showToast({ title: '表单提交失败', icon: 'none' });
      wx.hideToast();
    }finally {
      wx.hideLoading();
    }
  },

  async pointFormSubmit(){
    try{
      console.log('表单数据提交:', this.data.newPoint);
      wx.showLoading({
        title: '更新点位数据中...',
      })
      await request({
        url: app.globalData.URL + "admin/point",
        method: "POST",
        data: this.data.newPoint 
      })
    }catch (err) {
      console.error('表单提交失败:', err);
      wx.showToast({ title: '表单提交失败', icon: 'none' });
      wx.hideToast();
    }finally {
      wx.hideLoading();
    }
  }

});