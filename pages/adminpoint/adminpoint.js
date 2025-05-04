const getAllPointModule = require('../../utils/getAllpoint');
const getAllPathModule = require('../../utils/getAllPath');
const app = getApp();
const { request } = require("../../utils/request");
Page({
  data: {
    points: [],
    selectedPointIndex: 0,
    longitude: 120.1234567,
    latitude: 30.1234567,
    markers: [],
    showForm: false,
    newPoint:null
  },

  onLoad:async function (options) {
    const points = await getAllPointModule.fetchAllPoint();
    const paths = await getAllPathModule.fetchAllPath();
    this.setData({
      points,
      paths,
      type:options.type
    })
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
        title: selectedPoint.name
      }]
    });
  },

  onMarkerTap(){
    this.setData({
      showForm:true
    })
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

  async formSubmit() {
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
      wx.showToast({
        title: '上传成功！'
      })
      const points =await getAllPointModule.fetchAllPoint()
      this.setData({ points ,showForm:false})
      this.closeForm();
    } catch (err) {
      console.error('表单提交失败:', err);
      wx.showToast({ title: '表单提交失败', icon: 'none' });
      wx.hideToast();
    }finally {
      wx.hideLoading();
    }
  },

});