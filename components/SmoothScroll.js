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
  let moving, pos, scrollTimes, smoothTimes
  function setValues() {
    moving = false
    pos = target[scrollPosition]
    scrollTimes = 0
    smoothTimes = 0
  }
  setValues()

  target.addEventListener('scroll', (e) => {
    if (e.target !== target) return
    if (++scrollTimes > smoothTimes) { // external non-smooth scroll invoked
      setValues()
    }
  })

  function update() {
    moving = true
    const decimalDelta = (pos - target[scrollPosition]) / smooth
    const delta = Math.sign(decimalDelta) * Math.ceil(Math.abs(decimalDelta))
    ++smoothTimes
    if (Math.abs(decimalDelta) > 0) {
      target[scrollPosition] += delta
      requestAnimationFrame(update)
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
      pos = Math.max(0, Math.min(position, target[scrollLength] - target[clientLength])) // limit scrolling
      if (smooth) {
        if (!moving) update()
      } else {
        target[scrollPosition] = pos
      }
    }
  }
}
