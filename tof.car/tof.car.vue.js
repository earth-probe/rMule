let gTempCarInfo = false;
Vue.component('ui-tof-car', {
  data: function () {
    return {
      car: gTempCarInfo
    }
  },
  template: `
          <div class="card text-white bg-dark">
            <div class="card-body">
              
              <div class="row justify-content-center">
                <div class="col">
                  <div class="input-group mb-3">
                    <div class="input-group-prepend">
                      <span class="input-group-text">?</span>
                      <button type="button" class="btn btn-primary btn-sm" onclick="onUIMovePosition(this)">
                        <i class="fas fa-running"></i>
                        <i class="fas fa-check-circle"></i>
                      </button>
                    </div>
                    <input type="text" class="form-control" placeholder="move to mm">
                  </div>
                </div>
                <div class="col">
                  <div class="input-group mb-3">
                    <div class="input-group-prepend">
                      <span class="input-group-text">{{ car.tofMax }}</span>
                      <button type="button" class="btn btn-primary btn-sm" onclick="onUIChangeTofMax(this)">
                        <i class="fas fa-wave-square"></i>
                        <i class="fas fa-check-circle"></i>
                      </button>
                    </div>
                    <input type="text" class="form-control" placeholder="tof max">
                  </div>
                </div>
                <div class="col">
                  <div class="input-group mb-3">
                    <div class="input-group-prepend">
                      <span class="input-group-text">{{ car.tofMin }}</span>
                      <button type="button" class="btn btn-primary btn-sm" onclick="onUIChangeTofMin(this)">
                        <i class="fas fa-wave-square"></i>
                        <i class="fas fa-check-circle"></i>
                      </button>
                    </div>
                    <input type="text" class="form-control" placeholder="tof min ">
                  </div>
                </div>
                <div class="col">
                  <div class="input-group mb-3">
                    <div class="input-group-prepend">
                      <span class="input-group-text">{{ car.log }}</span>
                      <button type="button" class="btn btn-primary btn-sm" onclick="onUIChangeLogLevel(this)">
                        <i class="fas fa-stamp"></i>
                        <i class="fas fa-check-circle"></i>
                      </button>
                    </div>
                    <input type="text" class="form-control" placeholder="log level">
                  </div>
                </div>
              </div>
              
              
              <div class="row justify-content-center">
                <div class="col">
                  <div class="form-group text-center">
                    <label>Tof Distance <span class="badge badge-primary" id="vue-ui-current-position-label">{{ car.tof }}</span>unit</label>
                    <input type="range" disabled class="form-control-range" id="vue-ui-current-position-range" v-bind:value="car.tof" min="0" max="8000">
                  </div>
                </div>
              </div>
              
              
            </div>
          </div>
  `
})



onVueUICarInfo = (carInfo) => {
  console.log('onVueUICarInfo carInfo=<', carInfo,'>');
  gTempCarInfo = carInfo;
  new Vue({ el: '#ui-vue-tof-car'});
}

onVueUISerialPort = (ports) => {
  console.log('onVueUISerialPort ports=<', ports,'>');
  new Vue({ el: '#ui-vue-serial-port-select' ,data: {ports:ports}});
}






