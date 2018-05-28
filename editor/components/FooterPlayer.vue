<template>
  <div class="footer-player">
    <el-container class="play-bar">
      <el-aside width="100px" style="height: 104px" class="hidden-xs-only"> <!--Music Image-->
        <img src="static/pic/obstudio.png" width="100" height="100">
      </el-aside>
      <el-main style="height: 100px; padding-top: 0; padding-bottom: 0;">
        <el-row type="flex" justify="space-around">
          <el-col
            :span="7" :sm="5" :lg="3" :xl="2"
            style="color: white; text-align: left; padding-top: .3rem;"
            class="music-text">
            <h1 style="margin: .3rem">Ob Studio</h1>   <!--Music Name-->
            <p style="margin:.3rem">ObFish</p>         <!--Artists-->
          </el-col>
          <el-col :span="17" :sm="19" :lg="21" :xl="22">
            <el-row>
              <el-col :span="4" :sm="2" style="padding-top: .6rem; color: white">
                {{formatTime(Time)}}
              </el-col>
              <el-col :span="16" :sm="20">
                <el-slider v-model="Time" :step="1" :max="TotalTime" :format-tooltip="formatTime"></el-slider>
              </el-col>
              <el-col :span="4" :sm="2" style="padding-top: .6rem; color: white">
                {{formatTime(TotalTime)}}
              </el-col>
            </el-row>
            <el-row type="flex" justify="space-around">
              <el-col :span="4" class="hidden-xs-only">
                <el-button type="primary" :round="true"><icon name="list" scale="1.2"></icon></el-button>
              </el-col>
              <el-col :span="24" :sm="14">
                <el-button type="primary" :round="true" class="hidden-sm-and-down"><icon name="repeat" scale="1.2"></icon></el-button>
                <el-button type="primary" :round="true"><icon name="backward" scale="1.2"></icon></el-button>
                <el-button type="primary" :round="true"><icon name="play" scale="1.2"></icon></el-button>
                <el-button type="primary" :round="true"><icon name="forward" scale="1.2"></icon></el-button>
                <el-button type="primary" :round="true" class="hidden-sm-and-down"><icon name="random" scale="1.2"></icon></el-button>
              </el-col>
              <el-col :span="6" class="hidden-xs-only" style="padding-right: 1rem">
                <el-row class="hidden-sm-and-down">
                  <el-col :span="6">
                    <icon name="volume-up" scale="1.5" style="color: white; padding-top: 0.5rem;"></icon>
                  </el-col>
                  <el-col :span="18">
                    <el-slider v-model="Volume"></el-slider>
                  </el-col>
                </el-row>
                <el-popover ref="popover1" placement="top" width="160" trigger="click">
                  <el-slider v-model="Volume" :max="100"></el-slider>
                </el-popover>
                <el-button v-popover:popover1 type="primary" :round="true" class="hidden-md-and-up"><icon name="volume-up" scale="1.2"></icon></el-button>
              </el-col>
            </el-row>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
  .footer-player {
    position: fixed;
    right: 0;
    left: 0;
    bottom: -4px;
    background-color: #282828;
    height: 104px
  }
  .play-progress {
    position: fixed;
    right: 0;
    left: 0;
    bottom: 75px;
    z-index: 1024;
    padding: 0;
  }
  .el-aside {
    padding: 0;
  }
  .el-button {
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: .6rem;
    padding-bottom: .6rem;
  }
@media screen and (max-width: 320px){
  .el-button {
    margin-right: .1rem;
    margin-left: .1rem;
  }
}
@media screen and (max-width: 576px){
  .music-text h1 {
    font-size: 1.2rem
  }
  .music-text p {
    font-size: 1rem
  }
}
</style>

<script>
export default {
  name: 'FooterPlayer',
  data () {
    return {
      Time: this.InitialTime
    }
  },
  props: ['InitialTime', 'TotalTime', 'Volume'], // TODO: 考虑将Time和Volume增强为model，或者采用事件形式通知变化
  methods: {
    formatTime (time) {
      time = Math.ceil(time)
      const sec = time % 60
      const min = Math.floor(time / 60)
      return `${min}:${sec.toString().padStart(2, '0')}`
    }
  }
}
</script>
