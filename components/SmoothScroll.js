/**
 * 平滑滚动
 * @param {Element} target 目标元素
 * @param {Number} speed 滚动速度
 * @param {Number} smooth 平滑系数
 * @param {Boolean} vertical 方向是否为竖直
 * @param {Function} callback 回调函数
 */
module.exports = function SmoothScroll(target, {
  speed = 100,
  smooth = 10,
  vertical = true,
  callback = () => {}
} = {}) {
  // member name initialization
  let scrollLength, scrollPosition, clientLength
  if (vertical) {
    scrollLength = 'scrollHeight'
    scrollPosition = 'scrollTop'
    clientLength = 'clientHeight'
  } else {
    scrollLength = 'scrollWidth'
    scrollPosition = 'scrollLeft'
    clientLength = 'clientWidth'
  }
  // variable initialization
  let moving, pos, scrollTimes, smoothTimes, lastDelta
  function setValues() {
    moving = false
    pos = target[scrollPosition]
    scrollTimes = 0
    smoothTimes = 0
    lastDelta = 0
  }
  target[scrollPosition] = Math.floor(target[scrollPosition])
  setValues()

  target.addEventListener('scroll', (e) => {
    if (e.target !== target) return
    if (++scrollTimes > smoothTimes) { // external non-smooth scroll invoked
      setValues()
    }
  })

  function update() {
    moving = true
    // const currentPos = target[scrollPosition]
    // const decimalDelta = (pos - currentPos) / smooth
    // const direction = Math.sign(decimalDelta)
    // let round
    // if (direction === 1) {
    //   round = Math.ceil(currentPos) - currentPos
    // } else {
    //   round = Math.floor(currentPos) - currentPos
    // }
    // const delta = direction * Math.ceil(Math.abs(decimalDelta)) + round
    const decimalDelta = (pos - target[scrollPosition]) / smooth
    const delta = Math.sign(decimalDelta) * Math.ceil(Math.abs(decimalDelta))
    ++smoothTimes
    if (Math.abs(decimalDelta) > 0) {
      target[scrollPosition] += delta
      if (lastDelta * decimalDelta < 0) {
        pos = target[scrollPosition]
        moving = false
        lastDelta = 0
      } else {
        lastDelta = decimalDelta
        requestAnimationFrame(update)
      }
    } else {
      target[scrollPosition] = pos
      moving = false
    }
    callback(target)
  }

  return {
    scrollByDelta(delta, smooth = true) {
      this.scrollByPos(pos + delta / 100 * speed, smooth)
    },
    scrollByPos(position, smooth = true) {
      pos = Math.max(0, Math.min(Math.round(position), target[scrollLength] - target[clientLength])) // limit scrolling
      if (smooth) {
        if (!moving) update()
      } else {
        target[scrollPosition] = pos
      }
    }
  }
}
