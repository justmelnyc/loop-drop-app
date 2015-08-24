var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')
var renderRouting = require('./routing.js')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')

var ToggleButton = require('lib/params/toggle-button')
var RenameHook = require('lib/rename-hook')

var QueryParam = require('loop-drop-project/query-param')
var FlagParam = require('lib/flag-param')
var IndexParam = require('lib/index-param')

module.exports = function(node, opts){
  var data = node()
  var innerData = node.resolved() || {}

  var setup = node.context.setup
  var collection = node.context.collection
  var actions = node.context.actions

  if (data){

    var selected = setup.selectedChunkId() == data.id
    var headerStyle = {
      backgroundColor: color(innerData.color, selected ? 0.5 : 0.1)
    }
    var mainStyle = {
      border: '2px solid '+color(innerData.color, selected ? 1 : 0)
    }

    var minimised = QueryParam(node, 'minimised')
    var volume = QueryParam(node, 'volume', null, node.context)

    var classNames = [] 
    if (data.minimised) classNames.push('-minimised')
    if (selected) classNames.push('-selected')

    return h('div ExternalNode', {
      className: classNames.join(' '),
      'ev-click': send(setup.selectedChunkId.set, data.id),
      'style': mainStyle
    }, [
      h('header', {
        style: headerStyle
      }, [
        h('button.twirl', {
          'ev-click': send(toggleParam, minimised)
        }),
        h('span', {'ev-rename': RenameHook(node, selected, actions.updateChunkReferences)}),
        opts.volume ? Range(volume, {format: 'dB', title: 'vol', defaultValue: 1, width: 150, pull: true}) : null,
        opts.external ? h('button.edit Button -edit', {
          'ev-click': send(editChunk, node)
        }, 'edit') : null,
        h('button.remove Button -warn', {
          'ev-click': send(remove, node),
        }, 'X')
      ]),
      data.minimised ? '' : h('section', [
        opts.main
      ])
    ])
  }
  return h('UnknownNode')
}

function remove (chunk) {
  var project = chunk.context.project
  var collection = chunk.context.collection
  var fileObject = chunk.context.fileObject

  collection.remove(chunk)

  var descriptor = chunk()
  if (descriptor.id && chunk.getPath) {
    var path = chunk.getPath()
    var truePath = fileObject.resolvePath(descriptor.id + '.json')
    if (path === truePath) {
      var src = project.relative(chunk.getPath())
      project.deleteEntry(src)
    }
  }
}

function editChunk(chunk){
  var context = chunk.context
  var descriptor = chunk()
  if (descriptor && descriptor.src){
    var path = context.project.resolve([context.cwd||'', descriptor.src])
    context.actions.open(path)
  }
}

function toggleParam(param){
  param.set(!param.read())
}

function color(rgb, a){
  if (!Array.isArray(rgb)){
    rgb = [100,100,100]
  }
  return 'rgba(' + rgb[0] +','+rgb[1]+','+rgb[2]+','+a+')'
}