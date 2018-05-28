<template>
  <table>
<!--    <thead v-if="content.head">
      <th v-for="(head, index) in content.head" :key="index">
        {{head}}
      </th>
    </thead>
    <tbody>-->
    <tr v-for="(row, index) in node.content" :key="index">
      <td v-for="(col, colIndex) in row" :key="colIndex" v-html="col.text" :class="{em: col.em}" :style="{'text-align': align(col.al)}"></td>
    </tr>
    <!--</tbody>-->
  </table>
</template>

<script>
export default {
  name: 'Table',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  methods: {
    align(al) {
      switch (al) {
      case 1:
        return 'left'
      case 2:
        return 'center'
      case 3:
        return 'right'
      default:
        return 'left'
      }
    }
  }
}
</script>

<style>
.em {
  font-weight: bold;
}
</style>
