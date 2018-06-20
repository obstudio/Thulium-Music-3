module.exports = function SmoothScroll(target, speed, smooth, vertical = true) {
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

  let moving = false
  let pos = target[scrollLength]

  function scrolled(delta) {
    pos += delta / 100 * speed
    pos = Math.max(-10, Math.min(pos, target[scrollLength] - target[clientLength] + 10)) // limit scrolling

    if (!moving) update()
  }

  function update() {
    moving = true
    const delta = (pos - target[scrollPosition]) / smooth
    target[scrollPosition] += delta
    if (Math.abs(delta) > 0.5)
      requestAnimationFrame(update)
    else
      moving = false
  }
  return scrolled
}