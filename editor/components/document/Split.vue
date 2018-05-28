<template>
  <hr :class="[node.style === 1 ? node.double ? 'dd' : 'dash' : node.double ? 'double' : 'normal']">
</template>

<script>
export default {
  name: 'Split',
  props: {
    node: {
      type: Object,
      required: true
    }
  }
}
</script>

<style>
.dd {
  border: none;
  border-top-style: dashed;
  margin: auto;
  position: relative;
}

.dd::before {
  content: '';
  width: 100%;
  border-top-style: dashed;
  position: absolute;
  left: 0;
  top: 8px;
}

.double {
  border: none;
  border-top-style: double;
}

.dash {
  border: none;
  border-top-style: dashed;
}

.normal {
  border: none;
  border-top-style: solid;
}
</style>
