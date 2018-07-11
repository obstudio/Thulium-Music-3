# Thulium Music 3 [![Build Status](https://travis-ci.org/obstudio/Thulium-Music-3.svg?branch=master)](https://travis-ci.org/obstudio/Thulium-Music-3)

![screenshot](https://github.com/obstudio/Thulium-Music-3/blob/editor/assets/screenshot.png)

Thulium Music 3 是一个音乐编辑器和播放器。使用原创的 Thulium 语言作为编写语言，具有以下优点：

- 上手门槛低，编写速度快，合成效果好
- 支持内嵌 JavaScript 脚本，扩展性强
- 已有超过 80 首曲目和 2 个官方库可供参考
- 从 Thulium 的第一个版本到现在迭代数十个版本

未来的任务：

- 开发 C 语言的合成器，合成质量超过 Thulium 2 的水平
- 完善文档系统，撰写上万字的文档并开发智能化的文档渲染器
- 完善编辑器，提供对 Thulium 语言开发更多的原生支持
- 制作直接从 mid/tm 文件到视频的专业 MIDI 视频制作插件
- 开发用户社区，使所有的 tm 音乐可以在网络上交流和分享

软件仍在开发中，如果遇到问题，可以在[这里](https://github.com/obstudio/Thulium-Music-3/issues)向我们提出。

> 目前软件的合成效果还暂时达不到上一个大版本 [Thulium 2](https://github.com/obstudio/ThuliumMusic-WL) 的水平。如果想使用更加成熟的版本请前往那里，虽然它已经暂停维护了。

### 本地构建

1. 克隆我们的项目
2. `git submodule init`初始化子模块
3. `git submodule update`更新子模块
4. `npm i`更新依赖
5. `npm run build-doc`生成索引
6. `npm run start`运行
