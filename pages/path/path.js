const app = getApp();
const { request } = require("../../utils/request")
const EARTH_RADIUS = 6371; // 地球半径（千米）
// pages/path/index.js
Page({
  data: {
    startPoint: {},
    connectPoint: {},
    allPoints: [],   
    mapCenter: null,
    markers: [],
    polyline: []
  },

  onLoad(){
    this.fetchAllPoint();
  },

  //获取所有点位
  async fetchAllPoint(){
    try{
      wx.showLoading({
        title: '加载中...'
      })
      const serverRes =await request({
        url:app.globalData.URL+"navigation/all_point",
        method:"GET"
      });
      console.log("获取到的所有点位对象：",serverRes.data);
      this.setData({ allPoints: serverRes.data });
      wx.hideLoading();
    }catch (err) {
      console.error('获取点位失败:', err);
      wx.showToast({ title: '数据加载失败', icon: 'none' });
      wx.hideToast();
    }
  },

    // 自动匹配最近节点
    async chooseStartPoint() {
      try {
        const { latitude, longitude } = await this.getUserLocation();
        const nearest = this.findNearestPoint(latitude, longitude);
        this.setData({ startPoint: nearest });
      } catch (err) {
        wx.showToast({ title: '定位失败，请手动选择', icon: 'none' });
      }
    },
  
    // 获取用户位置
    getUserLocation() {
      return new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'wgs84',
          success: res => resolve(res),
          fail: () => reject()
        });
      });
    },

  // 计算最近节点
  findNearestPoint(lat, lng) {
    return this.data.allPoints.reduce((prev, curr) => {
      const prevDist = this.calculateDistance(lat, lng, prev.latitude, prev.longitude);
      const currDist = this.calculateDistance(lat, lng, curr.latitude, curr.longitude);
      return currDist < prevDist ? curr : prev;
    });
  },

   // 计算两点间距离（Haversine公式）
   calculateDistance(lat1, lng1, lat2, lng2) {
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },

  // 角度转弧度
  toRadians(degrees) {
    return degrees * Math.PI / 180;
  },

  // 选择连接点
  bindPickerChange(e) {
  const index = e.detail.value;
  this.setData({
    connectPoint: this.data.allPoints[index]
  });
  this.updateMapDisplay();
  },

  // 更新地图显示
  updateMapDisplay() {
    const { startPoint, connectPoint } = this.data
    if (!startPoint.latitude || !connectPoint.latitude) return

    // 计算地图中心点
    const center = {
      latitude: (startPoint.latitude + connectPoint.latitude) / 2,
      longitude: (startPoint.longitude + connectPoint.longitude) / 2
    }

    // 创建标记点
    const markers = [
      {
        id: 0,
        latitude: startPoint.latitude,
        longitude: startPoint.longitude,
        iconPath: '/images/start.png',
        width: 32,
        height: 32
      },
      {
        id: 1,
        latitude: connectPoint.latitude,
        longitude: connectPoint.longitude,
        iconPath: '/images/end.png',
        width: 32,
        height: 32
      }
    ]

    // 创建路径线
    const polyline = [{
      points: [
        { latitude: startPoint.latitude, longitude: startPoint.longitude },
        { latitude: connectPoint.latitude, longitude: connectPoint.longitude }
      ],
      color: "#3498db",
      width: 6,
      arrowLine: true
    }]

    this.setData({
      mapCenter: center,
      markers,
      polyline
    })
  },

  // 处理上传
  async handleUpload() {
    const { startPoint, connectPoint } = this.data
    if (!startPoint.name || !connectPoint.name) {
      wx.showToast({
        title: '请先选择地点',
        icon: 'none'
      })
      return
    }
    //TODO上传路径接口
    wx.showLoading({ title: '上传中...' });
    try {
      await request({
        url:app.globalData.URL+"navigation/path",
        method:"POST",
        data:{
          startPointName:this.data.startPoint.name,
          endPointName:this.data.connectPoint.name
        }
      });
      wx.showToast({ title: '上传成功' });
    } catch (err) {
      console.error('上传失败:', err);
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
})