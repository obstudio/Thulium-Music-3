<template>
<div :style="{width, height}">
  <!-- <el-dialog title="提示" :visible.sync="dialogVisible" width="60%">
    <span>为了提供沉浸式的编辑环境，我们请求为当前页面开启全屏模式。在全屏模式下，您随时可以通过F11按键退出。</span>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handle(3)">不再提醒</el-button>
      <el-button @click="handle(2)">取 消</el-button>
      <el-button type="primary" @click="handle(1)">仅此一次</el-button>
      <el-button type="primary" @click="handle(0)">确 定</el-button>
    </span>
  </el-dialog> -->
  <transition mode="in-out" @after-leave="requestFullScreen">
      <tm-monaco :width="width" :height="height"></tm-monaco>
  </transition>
</div>
</template>

<script>
import TmLoading from './TmLoading.vue'
import { defineLanguage } from '@/Editor'
import TmMonacoEditor from './TmMonacoEditor.vue'

export default {
  name: 'TmEditor',
  components: {
    TmLoading,
    TmMonaco: () => ({
      component: new Promise((resolve, reject) => {
        window.require(['vs/editor/editor.main'], () => {
          defineLanguage()
          resolve(TmMonacoEditor)
        })
      }),
      loading: TmLoading,
      error: TmLoading,
      delay: 200,
      timeout: 20000
    })
  },
  data () {
    return {
      dialogVisible: false
    }
  },
  methods: {
    requestFullScreen () {
      this.dialogVisible = true
    },
    handle(state) {
      switch (state) {
      case 0:
        document.documentElement.requestFullscreen()
        break
      case 1:
        document.documentElement.requestFullscreen()
        break
      case 2:
        break
      case 3:
        break
      }
      this.dialogVisible = false
    }
  },
  props: ['width', 'height']
}
</script>

<style>
.v-leave-active {
  transition: opacity 1s cubic-bezier(0.19, 1, 0.22, 1) 1s;
}

.v-leave-to {
  opacity: 0;
}
</style>
