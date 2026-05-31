module.exports = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          removeXMLNS: false,
          removeUselessStrokeAndFill: {
            removeNone: true
          },
          removeTitle: false
        }
      }
    },
    {
      name: 'removeDimensions',
      active: true
    },
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [
          { fill: 'currentColor' }
        ]
      }
    },
    {
      name: 'collapseGroups',
      active: true
    }
  ]
};
